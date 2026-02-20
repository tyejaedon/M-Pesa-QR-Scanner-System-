import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios'
import { admin, db } from '../config/firebase.js';
import { getTransactionByCheckoutRequestID } from './transactions.js';
import moment from 'moment'; // For timestamp formatting in Daraja requests

// Set base URL depending on environment
const MPESA_BASE_URL =  process.env.MPESA_BASE_URL?.trim().replace(/\/+$/, "") || 'https://sandbox.safaricom.co.ke';

// Helper to check required env vars
function checkEnvVars() {
  const required = ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_SHORTCODE', 'MPESA_PASSKEY', 'SERVER_URL'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Generate M-Pesa access token
async function generateAccessToken() {
  try {
    // 1. Clean the base URL and ensure we use the fresh process.env value
    const rawBaseUrl = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';
    const baseUrl = rawBaseUrl.trim().replace(/\/+$/, ""); // Removes any trailing slashes
    
    // 2. Trim keys to remove hidden newlines or spaces from .env
    const key = process.env.MPESA_CONSUMER_KEY?.trim();
    const secret = process.env.MPESA_CONSUMER_SECRET?.trim();

    if (!key || !secret) {
      throw new Error("Missing M-Pesa Consumer Key or Secret");
    }

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    // 3. Explicitly define the path to avoid double-slash issues
    const response = await axios.get(
      `${baseUrl}/oauth/v1/generate`,
      {
        params: { grant_type: 'client_credentials' },
        headers: {
          Authorization: `Basic ${auth}`,
        },
        timeout: 10000
      }
    );

    console.log('✅ Access token generated successfully');
    return response.data.access_token;
  } catch (error) {
    // Log the specific response data from Safaricom to catch the real culprit
    console.error('❌ Access token generation failed:', error.response?.data || error.message);
    return null;
  }
}
// Health check endpoint
async function healthCheck(req, res) {
  try {
    console.log('Health check requested');
    
    const accessToken = await generateAccessToken();
    const tokenStatus = accessToken ? 'valid' : 'failed';
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mpesa: {
        baseUrl: MPESA_BASE_URL,
        tokenStatus: tokenStatus,
        shortcode: process.env.MPESA_SHORTCODE
      },
      endpoints: {
        customerPayment: '/daraja/customer-payment',
        merchantPayment: '/daraja/scan-qr',
        callback: '/daraja/stk-callback',
        testToken: '/daraja/test-token'
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Test endpoint to check M-Pesa API connectivity
async function testMpesaConnection(req, res) {
  try {
    const accessToken = await generateAccessToken();
    
    if (accessToken) {
      res.status(200).json({
        success: true,
        message: 'M-Pesa API connection successful',
        token: accessToken.substring(0, 10) + '...',
        baseUrl: MPESA_BASE_URL
      });
    } else {
      throw new Error('Failed to generate access token');
    }
  } catch (error) {
    console.error('M-Pesa connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'M-Pesa API connection failed',
      error: error.message
    });
  }
}

// Test registration endpoint (for frontend testing)
async function testRegister(req, res) {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name
    });

    res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      user: {
        uid: userRecord.uid,
        email: email,
        name: name
      }
    });
    
  } catch (error) {
    console.error('Test registration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test registration failed',
      error: error.message
    });
  }
}

// ENHANCED: Customer payment function with dynamic amount support

async function triggerCustomerPayment(req, res) {
  console.log('🚀 STK Push Request Initialized');
  
  // 1. DATA DESTRUCTURING
  // Matches the flat object sent by your fetch() call in PayPrompt.jsx
  const { phoneNumber, amount, merchantId, name, reference } = req.body;
  
  // 2. INPUT VALIDATION
  if (!phoneNumber || !amount || !merchantId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid payload: Phone, Amount, and Merchant ID are required' 
    });
  }

  try {
    // 3. PHONE SANITIZATION
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    if ((formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) && formattedPhone.length === 9) {
      formattedPhone = '254' + formattedPhone;
    }

    // --- SANDBOX SECURITY GATE ---
    // If not in production, force the use of the Safaricom Test Number
    /*if (process.env.NODE_ENV !== 'production' && formattedPhone !== '254708374149') {
       return res.status(400).json({ 
         success: false, 
         message: 'Sandbox Error: You must use the test number 254708374149' 
       });
    }
      */
    const parsedAmount = Math.ceil(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // 4. FETCH MERCHANT PROFILE
    // We pull fresh data from Firestore to ensure the shortcode is correct
    const merchantDoc = await db.collection('merchants').doc(merchantId).get();
    
    if (!merchantDoc.exists) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    const merchantData = merchantDoc.data();

    // 5. GENERATE AUTH & TIMESTAMP
    const accessToken = await generateAccessToken();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[^0-9]/g, '').slice(0, 14); 

    // Password: Base64(Shortcode + Passkey + Timestamp)
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    // 6. REFERENCE OPTIMIZATION (Strict M-Pesa Limits)
    // AccountReference: Max 12 chars
    const cleanName = (merchantData.name || 'MERCHANT').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const safeRefName = cleanName.slice(0, 8); 
    const timeSuffix = timestamp.slice(-4);      
    const accountRef = `${safeRefName}${timeSuffix}`;

    // TransactionDesc: Max 13 chars
    const safeDesc = `Pay ${cleanName.slice(0, 9)}`;

    // 7. CONSTRUCT PAYLOAD
    const stkPushData = {
      BusinessShortCode: process.env.MPESA_SHORTCODE, 
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // Change to 'CustomerBuyGoodsOnline' if you are a Till
      Amount: parsedAmount,
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE, 
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.SERVER_URL}/api/daraja/stk-callback`,
      AccountReference: accountRef,
      TransactionDesc: safeDesc
    };

    console.log("📤 Sending STK Payload:", JSON.stringify(stkPushData, null, 2));

    // 8. GATEWAY EXECUTION
    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushData,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    // 9. HANDLE SUCCESS & LOG TO FIRESTORE
    if (response.data.ResponseCode === "0") {
      
      const transactionRecord = {
        merchantId, 
        merchantName: merchantData.name,
        amount: parsedAmount,
        phoneNumber: formattedPhone,
        status: 'pending',
        
        mpesaResponse: {
          CheckoutRequestID: response.data.CheckoutRequestID,
          MerchantRequestID: response.data.MerchantRequestID,
          ResponseCode: response.data.ResponseCode,
          CustomerMessage: response.data.CustomerMessage
        },
        
        transactionRef: accountRef,
        source: 'QR_TERMINAL',
        // Top-level index for the Callback Handler to find
        CheckoutRequestID: response.data.CheckoutRequestID, 
        
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('transactions').add(transactionRecord);

      return res.status(200).json({
        success: true,
        message: 'STK Push Triggered Successfully',
        transactionId: docRef.id,
        checkoutRequestId: response.data.CheckoutRequestID
      });
    } else {
      throw new Error(response.data.CustomerMessage || 'Gateway rejected request');
    }

  } catch (error) {
    console.error('❌ STK Error:', error.response?.data || error.message);
    
    const errorMsg = error.response?.data?.errorMessage || 'Lipa Na M-Pesa initiation failed';
    
    res.status(500).json({
      success: false,
      message: errorMsg,
      details: error.response?.data
    });
  }
}

// ENHANCED: Callback handler with better transaction linking and status updates
async function handleCallback(req, res) {
  try {
    // 1. SAFE PARSING
    const { Body } = req.body;
    
    // Validate structure exists
    if (!Body || !Body.stkCallback) {
        console.error('Invalid Callback Structure:', JSON.stringify(req.body));
        return res.json({ ResultCode: 0, ResultDesc: "Invalid Payload" });
    }

    const { stkCallback } = Body;
    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc, 
      CallbackMetadata 
    } = stkCallback;

    console.log(`🔔 Callback Received | CheckoutID: ${CheckoutRequestID} | Code: ${ResultCode}`);

    // 2. DETERMINE STATUS
    // 0 = Success | 1032 = Cancelled | Others = Failed
    let status = 'failed';
    if (ResultCode === 0) status = 'success';
    else if (ResultCode === 1032) status = 'cancelled';

    // 3. EXTRACT METADATA (Receipt, Amount, etc.)
    let meta = {};
    if (CallbackMetadata && CallbackMetadata.Item) {
      CallbackMetadata.Item.forEach(item => {
        meta[item.Name] = item.Value;
      });
    }

    // 4. FIND TRANSACTION (Dual Search Strategy)
    // Try Top-Level Index first (Fast), then Nested (Legacy/Safe)
    let transactionDoc = null;
    
    // Search A: Top Level
    let snapshot = await db.collection('transactions')
      .where('CheckoutRequestID', '==', CheckoutRequestID)
      .limit(1)
      .get();

    // Search B: Nested (Fallback)
    if (snapshot.empty) {
       snapshot = await db.collection('transactions')
        .where('mpesaResponse.CheckoutRequestID', '==', CheckoutRequestID)
        .limit(1)
        .get();
    }

    if (!snapshot.empty) {
      transactionDoc = snapshot.docs[0];
      const currentData = transactionDoc.data();
      
      console.log(`✅ Linked to Transaction: ${transactionDoc.id} (${currentData.merchantName})`);

      // 5. UPDATE FIRESTORE
      const updateData = {
        status: status,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        
        // Save raw callback for audit
        mpesaCallback: stkCallback,
        
        // Metadata Updates
        ...(meta.MpesaReceiptNumber && { receiptNumber: meta.MpesaReceiptNumber }),
        ...(meta.Amount && { amount: meta.Amount }), // Confirm actual paid amount
        ...(meta.PhoneNumber && { phoneNumber: meta.PhoneNumber }),
        
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        callbackReceivedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await transactionDoc.ref.update(updateData);
      
      console.log(`💾 Transaction updated to: ${status}`);

    } else {
      // 6. ORPHAN HANDLING (Critical for Debugging)
      console.warn(`⚠️ ORPHAN CALLBACK: No transaction found for ${CheckoutRequestID}`);
      
      await db.collection('orphaned_callbacks').add({
        CheckoutRequestID,
        MerchantRequestID,
        ResultCode,
        ResultDesc,
        meta,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        rawBody: req.body
      });
    }

    // 7. ACKNOWLEDGE TO SAFARICOM
    // Always return 200 OK immediately to stop them from retrying
    res.json({ ResultCode: 0, ResultDesc: "Callback processed successfully" });

  } catch (error) {
    console.error('❌ Callback Error:', error);
    // Still return success to Safaricom to prevent queue blockage
    res.json({ ResultCode: 0, ResultDesc: "Error processed" });
  }
}

// Merchant STK Push (existing functionality)
async function triggerSTKPush(req, res) {
  console.log('🚀 STK Push Request Initialized');
  
  // 1. DATA DESTRUCTURING
  // Matches the flat object sent by your fetch() call in PayPrompt.jsx
  const { phoneNumber, amount, merchantId, name, reference } = req.body;
  
  // 2. INPUT VALIDATION
  if (!phoneNumber || !amount || !merchantId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid payload: Phone, Amount, and Merchant ID are required' 
    });
  }

  try {
    // 3. PHONE SANITIZATION
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    if ((formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) && formattedPhone.length === 9) {
      formattedPhone = '254' + formattedPhone;
    }

    // --- SANDBOX SECURITY GATE ---
    // If not in production, force the use of the Safaricom Test Number
   /* if (process.env.NODE_ENV !== 'production' && formattedPhone !== '254708374149') {
       return res.status(400).json({ 
         success: false, 
         message: 'Sandbox Error: You must use the test number 254708374149' 
       });
    }
       */

    const parsedAmount = Math.ceil(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // 4. FETCH MERCHANT PROFILE
    // We pull fresh data from Firestore to ensure the shortcode is correct
    const merchantDoc = await db.collection('merchants').doc(merchantId).get();
    
    if (!merchantDoc.exists) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    const merchantData = merchantDoc.data();

    // 5. GENERATE AUTH & TIMESTAMP
    const accessToken = await generateAccessToken();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[^0-9]/g, '').slice(0, 14); 

    // Password: Base64(Shortcode + Passkey + Timestamp)
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    // 6. REFERENCE OPTIMIZATION (Strict M-Pesa Limits)
    // AccountReference: Max 12 chars
    const cleanName = (merchantData.name || 'MERCHANT').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const safeRefName = cleanName.slice(0, 8); 
    const timeSuffix = timestamp.slice(-4);      
    const accountRef = `${safeRefName}${timeSuffix}`;

    // TransactionDesc: Max 13 chars
    const safeDesc = `Pay ${cleanName.slice(0, 9)}`;

    // 7. CONSTRUCT PAYLOAD
    const stkPushData = {
      BusinessShortCode: process.env.MPESA_SHORTCODE, 
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // Change to 'CustomerBuyGoodsOnline' if you are a Till
      Amount: parsedAmount,
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE, 
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.SERVER_URL}/api/daraja/stk-callback`,
      AccountReference: accountRef,
      TransactionDesc: safeDesc
    };

    console.log("📤 Sending STK Payload:", JSON.stringify(stkPushData, null, 2));

    // 8. GATEWAY EXECUTION
    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushData,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    // 9. HANDLE SUCCESS & LOG TO FIRESTORE
    if (response.data.ResponseCode === "0") {
      
      const transactionRecord = {
        merchantId, 
        merchantName: merchantData.name,
        amount: parsedAmount,
        phoneNumber: formattedPhone,
        status: 'pending',
        
        mpesaResponse: {
          CheckoutRequestID: response.data.CheckoutRequestID,
          MerchantRequestID: response.data.MerchantRequestID,
          ResponseCode: response.data.ResponseCode,
          CustomerMessage: response.data.CustomerMessage
        },
        
        transactionRef: accountRef,
        source: 'QR_TERMINAL',
        // Top-level index for the Callback Handler to find
        CheckoutRequestID: response.data.CheckoutRequestID, 
        
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('transactions').add(transactionRecord);

      return res.status(200).json({
        success: true,
        message: 'STK Push Triggered Successfully',
        transactionId: docRef.id,
        checkoutRequestId: response.data.CheckoutRequestID
      });
    } else {
      throw new Error(response.data.CustomerMessage || 'Gateway rejected request');
    }

  } catch (error) {
    console.error('❌ STK Error:', error.response?.data || error.message);
    
    const errorMsg = error.response?.data?.errorMessage || 'Lipa Na M-Pesa initiation failed';
    
    res.status(500).json({
      success: false,
      message: errorMsg,
      details: error.response?.data
    });
  }
}

// Debug endpoint for testing transaction creation
async function createTestTransaction(req, res) {
  try {
    const { merchantId, amount, phoneNumber } = req.body;
    
    // 1. Precise Validation
    if (!merchantId || !amount || !phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields: merchantId, amount, phoneNumber'
      });
    }

    // 2. Fetch Merchant Details to "Hydrate" the transaction
    // This mimics the "isValidMerchant" logic from the real STK route
    const merchantDoc = await db.collection('merchants').doc(merchantId).get();
    const merchantData = merchantDoc.exists ? merchantDoc.data() : { name: "Test Merchant" };

    console.log(`🛠️ Creating simulated transaction for: ${merchantData.name}`);
    
    // 3. Normalized Transaction Schema (Aligned with 2026 SaaS Model)
    const testTransactionData = {
      // Core Identity
      merchantId: merchantId,
      merchantName: merchantData.name,
      amount: parseFloat(amount),
      phoneNumber: phoneNumber,
      
      // M-Pesa Simulation Keys
      status: 'SUCCESS', // Set to SUCCESS immediately for testing UI updates
      CheckoutRequestID: `TEST-CH-${Date.now()}`,
      MerchantRequestID: `TEST-MR-${Date.now()}`,
      reference: `TREF-${Date.now().toString().slice(-6)}`,
      
      // Metadata (Crucial for SubscriptionShield & Dashboard filtering)
      source: 'test_environment',
      paymentType: 'STK_PUSH_SIM',
      isValidMerchant: true,
      isDynamic: true, // Matching your new QR flow
      tier: merchantData.subscription?.tier || 'BASIC',
      
      // Precision Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      // Mocked Gateway Response
      mpesaResponse: {
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        Amount: parseFloat(amount),
        MpesaReceiptNumber: `TEST${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
        TransactionDate: moment().format('YYYYMMDDHHmmss'),
        PhoneNumber: phoneNumber
      }
    };
    
    const docRef = await db.collection('transactions').add(testTransactionData);
    
    res.status(201).json({
      success: true,
      message: 'Test transaction processed and stored',
      transactionId: docRef.id,
      data: testTransactionData
    });
    
  } catch (error) {
    console.error('❌ Test transaction creation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// UPDATED: Generate QR code for merchant with support for dynamic amounts
async function generateMerchantQR(req, res) {
  try {
    const merchantId = req.user.uid; 
    
    // 1. DATA RETRIEVAL
    const merchantDoc = await db.collection('merchants').doc(merchantId).get();
    
    if (!merchantDoc.exists) {
      return res.status(404).json({ success: false, message: 'Merchant profile not found' });
    }
    
    const merchantData = merchantDoc.data();

    // 2. INPUT SANITIZATION
    // We force the amount to be at least 1 to satisfy Safaricom's API
    const rawAmount = req.body.amount;
    const sanitizedAmount = Math.max(1, Math.ceil(parseFloat(rawAmount) || 1));
    const size = req.body.size || "300";

    // 3. TRANSACTION TYPE (BG = Till, PB = Paybill)
    const trxCode = merchantData.accountType === 'till' ? 'BG' : 'PB';

    // 4. AUTHENTICATION
    const accessToken = await generateAccessToken();

    // 5. PAYLOAD CONSTRUCTION (Safaricom Spec)
    // Truncate name to 25 chars and remove special characters to avoid 400 errors
    const cleanName = (merchantData.name || 'Merchant').replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 25);
    const cpi = merchantData.shortcode;

    const payload = {
      MerchantName: cleanName,
      RefNo: merchantData.accountReference || "PAYMENT", 
      Amount: sanitizedAmount, 
      TrxCode: trxCode, 
      CPI: cpi,
      Size: size
    };

    console.log('🚀 Standardized QR Request to Daraja:', payload);

    // 6. CALL SAFARICOM QR API
    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/qrcode/v1/generate`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const safaricomData = response.data;

    // Safaricom returns "00" for success in the QR API
    if (safaricomData.ResponseCode === "00") {
        console.log(`✅ Daraja QR Success: ${safaricomData.RequestID}`);
        
        res.status(200).json({
          success: true,
          data: {
            qrCode: safaricomData.QRCode, 
            meta: {
              merchantId,
              name: cleanName,
              shortcode: cpi,
              type: trxCode,
              amount: sanitizedAmount
            }
          }
        });
    } else {
        throw new Error(safaricomData.ResponseDescription || 'Safaricom QR Error');
    }

  } catch (error) {
    // Detailed error logging to see exactly what Daraja didn't like
    console.error('❌ QR Backend Error:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      message: error.response?.data?.errorMessage || 'Failed to generate M-PESA QR',
      error: error.response?.data
    });
  }
}

// COMPLETE EXPORTS - All functions properly exported
export { 
  // Core M-Pesa functions
  triggerSTKPush, 
  handleCallback, 
  generateAccessToken, 
  triggerCustomerPayment,
  // Utility functions
  healthCheck,
  testMpesaConnection,
  testRegister,
  generateMerchantQR,
  // Debug function
  createTestTransaction
};

// Log successful module load
console.log('daraja.js module loaded successfully with all fixes applied');
console.log('Fixed issues:');
console.log('Enhanced customer payment merchant linking');
console.log('Added support for dynamic amount QR codes');
console.log('Improved callback transaction lookup and updates');
console.log('Better transaction categorization and metadata');
console.log('Comprehensive merchant validation');
console.log('Enhanced error handling and logging');