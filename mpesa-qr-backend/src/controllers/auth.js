import { admin } from "../config/firebase.js";
import { db } from "../config/firebase.js";

async function createUserwithEmailandPaassword(req, res) {
  console.log('🚀 Backend signUp called with data:', req.body);
  
  const { uid, email, name, phone, shortcode, accountType, subscription } = req.body;

  // 1. Validation
  if (!uid || !email || !name || !phone || !shortcode) {
    return res.status(400).json({ error: "Missing identity fields" });
  }

  try {
    // 2. Verify Firebase Auth Record
    try {
      await admin.auth().getUser(uid);
    } catch (userError) {
      return res.status(400).json({ error: "Auth user not found in Firebase" });
    }
    
    // 3. Check for Duplicate Merchant
    const existingMerchant = await db.collection("merchants").doc(uid).get();
    if (existingMerchant.exists) {
      return res.status(400).json({ error: "Merchant already registered" });
    }

    // 4. PREPARE DATA
    const trialPeriodDays = 7; // 7-day trial
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + trialPeriodDays);

    // Default to 'paybill' if missing
    const cleanAccountType = accountType === 'till' ? 'till' : 'paybill';
    
    // Auto-generate safe reference for Paybills (e.g. URBANCAFE)
    const safeRef = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);

    const merchantData = {
      uid,
      email,
      name,
      phone,
      shortcode,
      
      // Payment Config
      accountType: cleanAccountType,
      accountReference: safeRef,

      // Subscription
      subscription: {
        tier: subscription?.tier?.toUpperCase() || 'BASIC',
        status: 'TRIALING',
        expiry: admin.firestore.Timestamp.fromDate(expiryDate)
      },

      // Addons
      addons: {
        menuEnabled: subscription?.addons?.includes('menu') || false,
        menuTrialEnd: admin.firestore.Timestamp.fromDate(expiryDate)
      },

      // Metadata (REMOVED environment TO FIX CRASH)
      metadata: {
        isBoarded: true,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        platform: 'web-v1'
      },

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 5. Atomic Write
    await db.collection("merchants").doc(uid).set(merchantData);

    console.log(`✅ Merchant ${name} registered successfully.`);

    res.status(201).json({ 
      message: "Merchant registered successfully", 
      uid,
      tier: merchantData.subscription.tier,
      type: cleanAccountType
    });

  } catch (error) {
    console.error('❌ Registration Failure:', error);
    
    // Rollback Auth
    try {
      await admin.auth().deleteUser(uid);
      console.log('⚠️ Rolled back Auth user creation');
    } catch (e) { /* user might not exist */ }

    res.status(500).json({ error: error.message });
  }
}

async function signInwithEmailandPassword(req, res) {
  console.log('Backend login called with data:', req.body);
  
  // Note: Actual login is handled client-side with Firebase Auth SDK.
  // This endpoint verifies the user and returns merchant details.
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "UID is required" });
  }

  try {
    console.log('Looking up user and merchant data...');
    
    const userRecord = await admin.auth().getUser(uid);
    const merchantDoc = await db.collection("merchants").doc(uid).get();

    if (!merchantDoc.exists) {
      console.log('Merchant not found in database');
      return res.status(404).json({ 
        error: "Merchant not found", 
        details: "User exists in Firebase Auth but merchant profile not found in database. Please complete registration.",
        uid: uid,
        email: userRecord.email,
        fixable: true
      });
    }

    const merchantData = merchantDoc.data();
    console.log('Merchant found:', merchantData);

    res.status(200).json({
      message: "Login successful",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: merchantData.name,
        phone: merchantData.phone,
        shortcode: merchantData.shortcode,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: `Failed to log in: ${error.message}` });
  }
}

// Fix incomplete registration - for when Firebase user exists but Firestore merchant doesn't
async function fixIncompleteRegistration(req, res) {
  console.log('Fixing incomplete registration...');
  
  const { email, name, phone, shortcode } = req.body;

  if (!email || !name || !phone || !shortcode) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Find the Firebase user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('Found Firebase user:', userRecord.uid);

    // Check if merchant document already exists
    const existingMerchant = await db.collection("merchants").doc(userRecord.uid).get();
    if (existingMerchant.exists) {
      return res.status(400).json({ error: "Merchant already registered" });
    }

    // Create the missing merchant document
    await db.collection("merchants").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      name: name,
      phone: phone,
      shortcode: shortcode,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Merchant document created successfully');

    res.status(200).json({ 
      message: "Registration completed successfully", 
      uid: userRecord.uid,
      merchant: {
        uid: userRecord.uid,
        email,
        name,
        phone,
        shortcode
      }
    });

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: "No Firebase user found with this email. Please register first." });
    }
    console.error('Fix registration error:', error);
    res.status(500).json({ error: `Failed to complete registration: ${error.message}` });
  }
}

// Clean up incomplete user - for when you want to start fresh
async function cleanupIncompleteUser(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Find and delete the Firebase user
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(userRecord.uid);
    
    // Also clean up any partial merchant document
    try {
      await db.collection("merchants").doc(userRecord.uid).delete();
      console.log('Deleted merchant document');
    } catch (deleteError) {
      console.log('No merchant document to delete');
    }

    console.log('User cleanup completed');
    res.status(200).json({ message: "User cleaned up successfully. You can now register again." });

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      res.status(404).json({ error: "User not found" });
    } else {
      console.error('Cleanup error:', error);
      res.status(500).json({ error: `Failed to cleanup user: ${error.message}` });
    }
  }
}

// Check user status - diagnostic endpoint
 async function checkUserStatus(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    let firebaseUser = null;
    let merchantDoc = null;

    // Check Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      firebaseUser = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      };

      // Check Firestore merchant document
      const merchantDocRef = await db.collection("merchants").doc(userRecord.uid).get();
      if (merchantDocRef.exists) {
        merchantDoc = merchantDocRef.data();
      }
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
    }

    res.status(200).json({
      email,
      firebaseUser,
      merchantDocument: merchantDoc,
      status: {
        firebaseUserExists: !!firebaseUser,
        merchantDocumentExists: !!merchantDoc,
        registrationComplete: !!(firebaseUser && merchantDoc)
      }
    });

  } catch (error) {
    console.error('Check user status error:', error);
    res.status(500).json({ error: `Failed to check user status: ${error.message}` });
  }
}

// Enhanced diagnostic function
async function diagnoseProblem(req, res) {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  console.log(`🔍 Diagnosing problem for email: ${email}`);
  
  try {
    let firebaseUser = null;
    let merchantDoc = null;
    let diagnosis = {};
    
    // Check Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      firebaseUser = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      };
      diagnosis.firebaseAuthStatus = "✅ Found in Firebase Auth";
      console.log(`✅ Firebase user found:`, firebaseUser);
      
      // Check Firestore merchant document
      const merchantDocRef = await db.collection("merchants").doc(userRecord.uid).get();
      if (merchantDocRef.exists) {
        merchantDoc = merchantDocRef.data();
        diagnosis.firestoreStatus = "✅ Found in Firestore merchants collection";
        console.log(`✅ Merchant document found:`, merchantDoc);
      } else {
        diagnosis.firestoreStatus = "❌ NOT found in Firestore merchants collection";
        diagnosis.problem = "Firebase user exists but Firestore merchant document is missing";
        diagnosis.solution = "Use fix-registration endpoint to create merchant document";
        console.log(`❌ Merchant document NOT found for UID: ${userRecord.uid}`);
      }
      
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        diagnosis.firebaseAuthStatus = "❌ NOT found in Firebase Auth";
        diagnosis.problem = "User doesn't exist in Firebase Auth";
        diagnosis.solution = "User needs to register first";
        console.log(`❌ Firebase user NOT found for email: ${email}`);
      } else {
        throw authError;
      }
    }
    
    // List all merchants for comparison
    const allMerchants = await db.collection("merchants").get();
    const merchantList = [];
    allMerchants.forEach(doc => {
      merchantList.push({ id: doc.id, email: doc.data().email, name: doc.data().name });
    });
    
    res.status(200).json({
      email,
      diagnosis,
      firebaseUser,
      merchantDocument: merchantDoc,
      allMerchantsInDatabase: merchantList,
      recommendation: diagnosis.solution || "User registration is complete"
    });

  } catch (error) {
    console.error('Diagnosis error:', error);
    res.status(500).json({ error: `Diagnosis failed: ${error.message}` });
  }
}

// Bulk fix for existing users
async function fixAllIncompleteUsers(req, res) {
  console.log('🔧 Starting bulk fix for incomplete users...');
  
  try {
    // Get all Firebase users
    const listUsers = await admin.auth().listUsers();
    console.log(`📊 Found ${listUsers.users.length} Firebase users`);
    
    // Get all merchants
    const merchants = await db.collection("merchants").get();
    const merchantUIDs = [];
    merchants.forEach(doc => merchantUIDs.push(doc.id));
    console.log(`📊 Found ${merchantUIDs.length} merchant documents`);
    
    // Find Firebase users without merchant documents
    const usersWithoutMerchants = listUsers.users.filter(user => !merchantUIDs.includes(user.uid));
    console.log(`🔍 Found ${usersWithoutMerchants.length} users without merchant documents`);
    
    const results = [];
    
    for (const user of usersWithoutMerchants) {
      console.log(`Processing: ${user.email} (${user.uid})`);
      
      results.push({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        status: 'missing_merchant_document',
        action_needed: 'Use fix-registration endpoint or delete if test user'
      });
    }
    
    res.status(200).json({
      message: 'Bulk fix analysis completed',
      totalFirebaseUsers: listUsers.users.length,
      totalMerchantDocs: merchantUIDs.length,
      incompleteUsers: results.length,
      incompleteUsersList: results
    });
    
  } catch (error) {
    console.error('❌ Error in bulk fix:', error);
    res.status(500).json({ error: `Bulk fix failed: ${error.message}` });
  }
}

async function verifyAndFetchProfile(req, res) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // 1. Verify the identity via Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. FETCH THE MERCHANT DATA FROM FIRESTORE
    // This is the step that actually populates your merchantData UI
    const merchantDoc = await admin.firestore().collection('merchants').doc(uid).get();

    if (!merchantDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Merchant profile not found in database' 
      });
    }

    const merchantData = merchantDoc.data();

    // 3. RESPOND WITH THE FULL SCHEMA
    // This matches the response.data.user expectation in your AuthProvider
    return res.status(200).json({
      success: true,
      user: {
        uid: uid,
        name: merchantData.name,
        email: merchantData.email,
        phone: merchantData.phone,
        shortcode: merchantData.shortcode,
        accountType: merchantData.accountType || 'paybill',
        subscription: {
          tier: merchantData.subscription?.tier || 'BASIC',
          status: merchantData.subscription?.status || 'TRIALING',
          expiry: merchantData.subscription?.expiry
        },
        addons: {
          menuEnabled: merchantData.addons?.menuEnabled || false
        },
        metadata: merchantData.metadata || {}
      }
    });

  } catch (error) {
    console.error("❌ Auth Verification Error:", error.message);
    res.status(401).json({ success: false, error: 'Session expired or invalid' });
  }
}

export  { 
  createUserwithEmailandPaassword, 
  signInwithEmailandPassword, 
  fixIncompleteRegistration, 
  cleanupIncompleteUser, 
  checkUserStatus,
  diagnoseProblem,
  fixAllIncompleteUsers,
  verifyAndFetchProfile
};
