import { admin } from "../config/firebase.js";
import { db } from "../config/firebase.js";

// Firestore timestamp serialization helpers

// NEW: Global fetch to test database connectivity regardless of user
export async function getAllTransactionsGlobal(req, res) {
  try {
    console.log("🚀 Global fetch initiated: Bypassing user filters...");
    
    // Simple query with no .where() clauses
    const snapshot = await db.collection("transactions")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      console.log("Empty collection: No transactions found in the entire DB.");
      return res.status(200).json({
        status: 'success',
        count: 0,
        transactions: []
      });
    }

    const transactions = snapshot.docs.map(doc => serializeTransaction({
      id: doc.id,
      ...doc.data(),
      debugMode: true // Mark these as global results
    }));

    console.log(`✅ Successfully retrieved ${transactions.length} total transactions from DB.`);

    res.status(200).json({
      status: 'success',
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('Global fetch error:', error);
    res.status(500).json({ 
      error: `Database connection failed: ${error.message}` 
    });
  }
}

function convertFirestoreTimestamp(timestamp) {
  if (!timestamp) return null;
  
  if (timestamp._seconds && timestamp._nanoseconds) {
    return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
  }
  
  if (timestamp.seconds && timestamp.nanoseconds) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  
  return null;
}

function serializeTransaction(transaction) {
  if (!transaction) return null;
  
  const serialized = { ...transaction };
  
  // Convert Firestore timestamps to ISO strings
  ['createdAt', 'updatedAt', 'callbackReceivedAt', 'lastCallbackAt'].forEach(field => {
    if (serialized[field]) {
      const converted = convertFirestoreTimestamp(serialized[field]);
      serialized[field] = converted ? converted.toISOString() : null;
    }
  });
  
  // Handle nested timestamp fields
  if (serialized.guestMerchantInfo?.createdAt) {
    const converted = convertFirestoreTimestamp(serialized.guestMerchantInfo.createdAt);
    serialized.guestMerchantInfo.createdAt = converted ? converted.toISOString() : null;
  }
  
  if (serialized.paymentDetails?.completedAt) {
    const converted = convertFirestoreTimestamp(serialized.paymentDetails.completedAt);
    serialized.paymentDetails.completedAt = converted ? converted.toISOString() : null;
  }
  
  return serialized;
}

// ENHANCED: Safe query executor with fallback for index issues
// Add merchantId and guestId as explicit arguments
async function executeQueriesWithFallback(directQuery, guestQuery, merchantId, guestId, period, filterDate, endFilterDate) {
  try {
    const [directSnapshot, guestSnapshot] = await Promise.all([
      directQuery.get(),
      guestQuery.get()
    ]);
    return [directSnapshot, guestSnapshot];
  } catch (error) {
    console.log(`Initial query failed: ${error.message}`);
    console.log(`Falling back to simple merchant lookup...`);

    try {
      // ✅ Use the IDs passed as arguments instead of digging into internals
      const directQuerySimple = db.collection("transactions").where("merchantId", "==", merchantId);
      const guestQuerySimple = db.collection("transactions").where("guestMerchantInfo.originalMerchantId", "==", guestId);

      const [directSnapshot, guestSnapshot] = await Promise.all([
        directQuerySimple.get(),
        guestQuerySimple.get()
      ]);

      if (period !== 'all' && filterDate) {
        const filterDocs = (snapshot) => snapshot.docs.filter(doc => {
          const createdAt = convertFirestoreTimestamp(doc.data().createdAt);
          if (!createdAt) return false;
          return endFilterDate 
            ? (createdAt >= filterDate && createdAt <= endFilterDate)
            : (createdAt >= filterDate);
        });

        return [
          { docs: filterDocs(directSnapshot) },
          { docs: filterDocs(guestSnapshot) }
        ];
      }
      return [directSnapshot, guestSnapshot];
    } catch (fallbackError) {
      console.error(`Fatal fallback error:`, fallbackError);
      throw fallbackError;
    }
  }
}

// ENHANCED: Create merchant transaction with QR support
async function createTransaction(req, res) {
  const { phoneNumber, amount, qrData, reference, description } = req.body;
  const merchantId = req.user.uid;
  
  if (!phoneNumber || !amount) {
    return res.status(400).json({ error: "Phone number and amount are required" });
  }

  try {
    const transactionRef = reference || `Tx_${Date.now()}`;
    
    // Enhanced transaction data with QR support
    const transactionData = {
      merchantId,
      transactionRef,
      phoneNumber,
      amount: parseFloat(amount),
      status: "pending",
      paymentType: 'merchant_initiated',
      source: qrData ? 'qr_generated' : 'api_direct',
      isValidMerchant: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add QR data if provided
    if (qrData) {
      transactionData.qrData = qrData;
      transactionData.description = description || qrData.description || 'QR Payment';
      transactionData.name = QrData.name;
      transactionData.qrMetadata = {
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        qrType: qrData.type || 'merchant_payment',
        qrVersion: qrData.version || '1.0'
      };
    } else if (description) {
      transactionData.description = description;
    }

    const docRef = await db.collection("transactions").add(transactionData);

    console.log(`Transaction ${docRef.id} created successfully - ${qrData ? 'QR-based' : 'Direct API'}`);

    res.status(201).json({ 
      status: "Transaction successful", 
      data: { 
        transactionRef,
        transactionId: docRef.id,
        qrSupported: !!qrData
      } 
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: `Failed to create transaction: ${error.message}` });
  }
}

// ENHANCED: getTransactions with QR metadata and improved filtering
async function getTransactions(req, res) {
  const merchantId = req.user.uid;
  console.log(`Fetching transactions for merchant: ${merchantId}`);
  const { 
    period = 'all', 
    status, 
    startDate, 
    endDate, 
    limit = 100,
    includeGuest = true,
    source // New: filter by transaction source (qr_scanner, api_direct, etc.)
  } = req.query;

  try {
    console.log(`getTransactions - merchant: ${merchantId}, period: ${period}, status: ${status}, source: ${source}, includeGuest: ${includeGuest}`);

    // Calculate date range
    const now = new Date();
    let filterDate = null;
    let endFilterDate = null;

    if (period === 'custom' && startDate && endDate) {
      filterDate = new Date(startDate);
      filterDate.setHours(0, 0, 0, 0);
      
      endFilterDate = new Date(endDate);
      endFilterDate.setHours(23, 59, 59, 999);
    } else if (period !== 'all') {
      filterDate = new Date();
      switch (period) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          endFilterDate = new Date();
          endFilterDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
    }

    // Build queries with potential date filtering
    let directQuery = db.collection("transactions")
      .where("merchantId", "==", merchantId);
    
    let guestQuery = db.collection("transactions")
      .where("guestMerchantInfo.originalMerchantId", "==", merchantId);

    // Apply date filtering if needed
    if (filterDate && period !== 'all') {
      const startTimestamp = admin.firestore.Timestamp.fromDate(filterDate);
      directQuery = directQuery.where("createdAt", ">=", startTimestamp);
      guestQuery = guestQuery.where("createdAt", ">=", startTimestamp);
      
      if (endFilterDate) {
        const endTimestamp = admin.firestore.Timestamp.fromDate(endFilterDate);
        directQuery = directQuery.where("createdAt", "<=", endTimestamp);
        guestQuery = guestQuery.where("createdAt", "<=", endTimestamp);
      }
    }

    // Apply limit
    directQuery = directQuery.limit(parseInt(limit));
    guestQuery = guestQuery.limit(parseInt(limit));

    // Execute queries with fallback
    const [directSnapshot, guestSnapshot] = await executeQueriesWithFallback(
      directQuery, guestQuery, period, filterDate, endFilterDate
    );

    console.log(`Found ${directSnapshot.docs.length} direct + ${guestSnapshot.docs.length} guest transactions`);

    // Combine and deduplicate
    const allTransactionDocs = [
      ...directSnapshot.docs,
      ...guestSnapshot.docs.filter(doc => 
        !directSnapshot.docs.some(directDoc => directDoc.id === doc.id)
      )
    ];

    // ENHANCED: Map and serialize transactions with QR metadata
    let transactions = allTransactionDocs.map(doc => {
      const data = doc.data();
      return serializeTransaction({
        id: doc.id,
        ...data,
        merchantValidation: {
          isValid: data.isValidMerchant || false,
          merchantType: data.isValidMerchant ? 'registered' : 'guest',
          paymentType: data.paymentType || 'unknown',
          source: data.source || 'unknown'
        },
        // Enhanced QR metadata
        qrMetadata: data.qrMetadata ? {
          ...data.qrMetadata,
          hasQRData: !!data.qrData,
          qrSource: data.source === 'qr_scanner' ? 'customer_scanned' : 
                   data.source === 'qr_generated' ? 'merchant_generated' : 'none'
        } : {
          hasQRData: !!data.qrData,
          qrSource: data.source === 'qr_scanner' ? 'customer_scanned' : 
                   data.source === 'qr_generated' ? 'merchant_generated' : 'none'
        }
      });
    });

    // Apply status filtering
    if (status && status !== 'all') {
      transactions = transactions.filter(t => t.status === status);
    }

    // NEW: Apply source filtering for QR vs non-QR transactions
    if (source) {
      transactions = transactions.filter(t => {
        switch (source) {
          case 'qr':
            return t.source === 'qr_scanner' || t.source === 'qr_generated' || !!t.qrData;
          case 'manual':
            return t.source === 'api_direct' || t.source === 'merchant_dashboard';
          case 'customer_qr':
            return t.source === 'qr_scanner' && t.paymentType === 'customer_initiated';
          case 'merchant_qr':
            return t.source === 'qr_generated' && t.paymentType === 'merchant_initiated';
          default:
            return t.source === source;
        }
      });
    }

    // Sort by creation date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`Returning ${transactions.length} transactions for merchant ${merchantId}`);

    res.status(200).json({
      status: 'success',
      transactions,
      metadata: {
        total: transactions.length,
        directTransactions: directSnapshot.docs.length,
        guestTransactions: guestSnapshot.docs.length,
        totalReturned: transactions.length,
        merchantId: merchantId,
        filters: { period, status, source, includeGuest },
        queryMethod: period === 'all' ? 'direct' : 'fallback-safe',
        // Enhanced QR statistics
        qrStatistics: {
          qrTransactions: transactions.filter(t => t.qrMetadata?.hasQRData).length,
          customerScannedQR: transactions.filter(t => t.qrMetadata?.qrSource === 'customer_scanned').length,
          merchantGeneratedQR: transactions.filter(t => t.qrMetadata?.qrSource === 'merchant_generated').length,
          nonQrTransactions: transactions.filter(t => !t.qrMetadata?.hasQRData).length
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: `Failed to retrieve transactions: ${error.message}` });
  }
}
// TREND CALCULATOR: Simple linear regression for revenue forecasting
// Helper: Calculate Linear Regression Trend
function calculateTrend(dataPoints) {
  const n = dataPoints.length;
  // Need at least 2 points to make a line
  if (n < 2) return { slope: 0, nextPeriodPrediction: 0, trend: 'stable' };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  dataPoints.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += (p.x * p.y);
    sumXX += (p.x * p.x);
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Predict the value for the NEXT period (n + 1)
  const nextVal = (slope * (n + 1)) + intercept;
  
  return { 
    slope, 
    nextPeriodPrediction: Math.max(0, nextVal), // Prevent negative revenue
    trend: slope > 0.5 ? 'growth' : slope < -0.5 ? 'decline' : 'stable'
  };
}


// ENHANCED: Transaction analytics with QR insights
async function getTransactionAnalytics(req, res) {
  try {
    const merchantId = req.user.uid;
    const { 
      period = 'week', 
      status,           
      includeQRMetrics = 'true' 
    } = req.query;

    console.log(`Analytics Request: ${merchantId} [${period}]`);

    // 1. DATE RANGE CALCULATION
    const now = new Date();
    let queryStartDate = new Date();
    let queryEndDate = new Date(); 

    queryEndDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        queryStartDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        queryStartDate.setDate(now.getDate() - 7);
        queryStartDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        queryStartDate.setMonth(now.getMonth() - 1);
        queryStartDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        queryStartDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        queryStartDate.setDate(now.getDate() - 7);
    }

    // 2. FIRESTORE QUERIES
    const startTimestamp = admin.firestore.Timestamp.fromDate(queryStartDate);
    const endTimestamp = admin.firestore.Timestamp.fromDate(queryEndDate);

    const transactionsRef = db.collection('transactions');

    const directQuery = transactionsRef
      .where('merchantId', '==', merchantId)
      .where('createdAt', '>=', startTimestamp)
      .where('createdAt', '<=', endTimestamp)
      .get();

    const guestQuery = transactionsRef
      .where('guestMerchantInfo.originalMerchantId', '==', merchantId)
      .where('createdAt', '>=', startTimestamp)
      .where('createdAt', '<=', endTimestamp)
      .get();

    const [directSnapshot, guestSnapshot] = await Promise.all([directQuery, guestQuery]);

    // 3. MERGE & DEDUPLICATE DATA
    const allDocs = [
      ...directSnapshot.docs,
      ...guestSnapshot.docs.filter(gDoc => !directSnapshot.docs.some(dDoc => dDoc.id === gDoc.id))
    ];

    let transactions = allDocs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (status && status !== 'all') {
      transactions = transactions.filter(t => t.status === status);
    }

    // Sort Newest to Oldest for the UI List, but we will handle chronological for charts later
    transactions.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA; 
    });

    // 4. AGGREGATION & ANALYTICS LOOP
    let totalRevenue = 0;
    let qrRevenue = 0;
    
    const successfulTransactions = [];
    const pendingTransactions = [];
    const failedTransactions = [];
    
    let qrCount = 0;
    let customerScannedCount = 0;
    let merchantGeneratedCount = 0;

    const dailyMap = {};
    for (let d = new Date(queryStartDate); d <= queryEndDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = { date: dateKey, totalRevenue: 0, count: 0 };
    }

    const hoursMap = new Array(24).fill(0);

    // FIX: Moved the arrays outside the loop, now iterate properly
    transactions.forEach(t => {
      if (t.status === 'success') successfulTransactions.push(t);
      else if (t.status === 'pending') pendingTransactions.push(t);
      else failedTransactions.push(t);

      if (t.status === 'success') {
        const amount = Number(t.amount) || 0;
        totalRevenue += amount;

        // Safe Date Extraction
        let dateObj = new Date();
        if (t.createdAt?.toDate) {
            dateObj = t.createdAt.toDate();
        } else if (t.createdAt) {
            dateObj = new Date(t.createdAt);
        }
        
        const dateKey = dateObj.toISOString().split('T')[0];
        const hour = dateObj.getHours();

        hoursMap[hour]++;

        if (dailyMap[dateKey]) {
          dailyMap[dateKey].totalRevenue += amount;
          dailyMap[dateKey].count++;
        }

        const isQR = t.qrMetadata?.hasQRData || (t.source && typeof t.source === 'string' && t.source.toLowerCase().includes('qr'));
        
        if (isQR) {
          qrRevenue += amount;
          qrCount++;
          if (t.qrMetadata?.qrSource === 'customer_scanned') customerScannedCount++;
          if (t.qrMetadata?.qrSource === 'merchant_generated') merchantGeneratedCount++;
        }
      }
    });

    // 5. INTELLIGENCE PROCESSING
    const peakHourIndex = hoursMap.indexOf(Math.max(...hoursMap));
    const peakTimeLabel = `${peakHourIndex.toString().padStart(2, '0')}:00 - ${(peakHourIndex + 1).toString().padStart(2, '0')}:00`;

    const sortedSummaries = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const regressionPoints = sortedSummaries.map((day, index) => ({
      x: index + 1,
      y: day.totalRevenue
    }));

    const predictionModel = calculateTrend(regressionPoints);

    // 6. FINAL RESPONSE CONSTRUCTION
    const analyticsData = {
      period,
      dateRange: {
        start: queryStartDate.toISOString(),
        end: queryEndDate.toISOString()
      },
      summary: {
        totalTransactions: transactions.length,
        successfulTransactions: successfulTransactions.length,
        pendingTransactions: pendingTransactions.length,
        failedTransactions: failedTransactions.length,
        totalRevenue,
        successRate: transactions.length > 0 ? ((successfulTransactions.length / transactions.length) * 100).toFixed(1) : 0,
        averageTransaction: successfulTransactions.length > 0 ? (totalRevenue / successfulTransactions.length).toFixed(2) : 0
      },
      insights: {
        peakTradingHour: peakTimeLabel,
        peakTradingVolume: Math.max(...hoursMap),
        hourlyDistribution: hoursMap,
        prediction: {
          model: "Linear Regression",
          trendDirection: predictionModel.trend,
          nextDayRevenue: Math.round(predictionModel.nextPeriodPrediction),
          confidenceLevel: regressionPoints.filter(p => p.y > 0).length >= 3 ? "high" : "low"
        }
      },
      qrAnalytics: includeQRMetrics === 'true' ? {
        totalQRTransactions: qrCount,
        qrRevenue,
        nonQrRevenue: totalRevenue - qrRevenue,
        qrAdoptionRate: transactions.length > 0 ? ((qrCount / transactions.length) * 100).toFixed(1) : 0,
        breakdown: {
          customerScanned: customerScannedCount,
          merchantGenerated: merchantGeneratedCount
        }
      } : null,
      dailySummaries: sortedSummaries
    };

    

    res.status(200).json({
      status: 'success',
      analytics: analyticsData,
      transactions: transactions // <--- 🔥 THE MISSING LINK IS NOW HERE
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate analytics',
      error: error.message
    });
  }
}

// ENHANCED: Get single transaction with QR metadata
async function getTransactionById(req, res) {
  const { transactionId } = req.params;
  const merchantId = req.user.uid;

  try {
    const transactionDoc = await db.collection("transactions").doc(transactionId).get();

    if (!transactionDoc.exists) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const transaction = transactionDoc.data();

    // Support both real merchant transactions and guest transactions
    const belongsToMerchant = transaction.merchantId === merchantId ||
      (transaction.guestMerchantInfo?.originalMerchantId === merchantId);

    if (!belongsToMerchant) {
      return res.status(403).json({ error: "Access denied" });
    }

    const serializedTransaction = serializeTransaction({
      id: transactionDoc.id,
      ...transaction,
      merchantValidation: {
        isValid: transaction.isValidMerchant || false,
        merchantType: transaction.isValidMerchant ? 'registered' : 'guest',
        paymentType: transaction.paymentType || 'unknown',
        source: transaction.source || 'unknown'
      },
      // Enhanced QR metadata for single transaction
      qrMetadata: {
        hasQRData: !!transaction.qrData,
        qrSource: transaction.source === 'qr_scanner' ? 'customer_scanned' : 
                 transaction.source === 'qr_generated' ? 'merchant_generated' : 'none',
        qrType: transaction.qrData?.type || transaction.qrMetadata?.qrType || null,
        qrVersion: transaction.qrData?.version || transaction.qrMetadata?.qrVersion || null,
        name: transaction.qrData?.name || transaction.name || null,
        qrReference: transaction.qrData?.reference || null,
        qrDescription: transaction.qrData?.description || null
      }
    });

    res.status(200).json({ 
      status: "success", 
      transaction: serializedTransaction
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to retrieve transaction: ${error.message}` });
  }
}

// Get transaction by CheckoutRequestID (for callback updates) - Enhanced with QR logging
async function getTransactionByCheckoutRequestID(checkoutRequestID) {
  try {
    console.log(`Searching for transaction with CheckoutRequestID: ${checkoutRequestID}`);
    
    // Strategy 1: Search in CheckoutRequestID field (new consistent format)
    let snapshot = await db.collection('transactions')
      .where('CheckoutRequestID', '==', checkoutRequestID)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      const qrInfo = data.qrData ? `QR:${data.qrData.type || 'unknown'}` : 'non-QR';
      console.log(`Found transaction via CheckoutRequestID field: ${doc.id} (${data.isValidMerchant ? 'real' : 'guest'} merchant, ${qrInfo})`);
      return {
        id: doc.id,
        ref: doc.ref,
        data: data
      };
    }

    // Strategy 2: Search in nested mpesaResponse.CheckoutRequestID (legacy format)
    snapshot = await db.collection('transactions')
      .where('mpesaResponse.CheckoutRequestID', '==', checkoutRequestID)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      const qrInfo = data.qrData ? `QR:${data.qrData.type || 'unknown'}` : 'non-QR';
      console.log(`Found transaction via mpesaResponse.CheckoutRequestID: ${doc.id} (${data.isValidMerchant ? 'real' : 'guest'} merchant, ${qrInfo})`);
      return {
        id: doc.id,
        ref: doc.ref,
        data: data
      };
    }

    // Strategy 3: Search with case variations
    const variations = [
      checkoutRequestID.toLowerCase(),
      checkoutRequestID.toUpperCase()
    ];

    for (const variation of variations) {
      snapshot = await db.collection('transactions')
        .where('CheckoutRequestID', '==', variation)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        const qrInfo = data.qrData ? `QR:${data.qrData.type || 'unknown'}` : 'non-QR';
        console.log(`Found transaction via CheckoutRequestID variation: ${doc.id} (${data.isValidMerchant ? 'real' : 'guest'} merchant, ${qrInfo})`);
        return {
          id: doc.id,
          ref: doc.ref,
          data: data
        };
      }
    }

    console.log(`No transaction found for CheckoutRequestID: ${checkoutRequestID}`);
    return null;
  } catch (error) {
    console.error('Error finding transaction by CheckoutRequestID:', error);
    return null;
  }
}

// ENHANCED: Debug endpoint with QR analytics
async function debugTransactions(req, res) {
  const merchantId = req.user.uid;
  
  try {
    console.log(`Debug request for merchant: ${merchantId}`);

    const allTransactionsSnapshot = await db.collection('transactions').limit(100).get();
    const merchantTransactionsSnapshot = await db.collection('transactions')
      .where('merchantId', '==', merchantId)
      .limit(50)
      .get();

    const allTransactions = allTransactionsSnapshot.docs.map(doc =>
      serializeTransaction({ id: doc.id, ...doc.data() })
    );

    const merchantTransactions = merchantTransactionsSnapshot.docs.map(doc =>
      serializeTransaction({ id: doc.id, ...doc.data() })
    );

    // Enhanced field issues tracking with QR metrics
    const fieldIssues = {
      missingMerchantId: allTransactions.filter(t => !t.merchantId && !t.guestMerchantInfo).length,
      missingCheckoutRequestID: allTransactions.filter(t => 
        !t.CheckoutRequestID && !t.mpesaResponse?.CheckoutRequestID
      ).length,
      withCallbacks: allTransactions.filter(t => t.callbackData || t.callbackMetadata).length,
      pendingTransactions: merchantTransactions.filter(t => t.status === 'pending').length,
      successfulTransactions: merchantTransactions.filter(t => t.status === 'success').length,
      failedTransactions: merchantTransactions.filter(t => t.status === 'failed').length,
      errorTransactions: merchantTransactions.filter(t => t.status === 'error').length,
      validMerchantTransactions: allTransactions.filter(t => t.isValidMerchant === true).length,
      guestTransactions: allTransactions.filter(t => t.isValidMerchant === false || t.guestMerchantInfo).length,
      nullMerchantId: allTransactions.filter(t => t.merchantId === null).length,
      // NEW: QR-related issues
      qrTransactions: allTransactions.filter(t => !!t.qrData).length,
      qrWithoutMetadata: allTransactions.filter(t => !!t.qrData && !t.qrMetadata).length,
      incompleteQRData: allTransactions.filter(t => t.qrData && (!t.qrData.merchantId || !t.qrData.amount)).length
    };

    const statusDistribution = {
      success: merchantTransactions.filter(t => t.status === 'success').length,
      pending: merchantTransactions.filter(t => t.status === 'pending').length,
      failed: merchantTransactions.filter(t => t.status === 'failed').length,
      error: merchantTransactions.filter(t => t.status === 'error').length,
      other: merchantTransactions.filter(t => !['success', 'pending', 'failed', 'error'].includes(t.status)).length
    };

    // Enhanced payment type distribution with QR insights
    const paymentTypeDistribution = {
      customerToMerchant: allTransactions.filter(t => t.paymentType === 'customer_initiated').length,
      merchantInitiated: allTransactions.filter(t => t.paymentType === 'merchant_initiated').length,
      qrScanned: allTransactions.filter(t => t.source === 'qr_scanner').length,
      qrGenerated: allTransactions.filter(t => t.source === 'qr_generated').length,
      unknown: allTransactions.filter(t => !t.paymentType).length
    };

    // Enhanced recent transactions with QR info
    const recentTransactions = merchantTransactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(tx => ({
        id: tx.id,
        amount: tx.amount,
        status: tx.status,
        phoneNumber: tx.phoneNumber || tx.customerPhoneNumber,
        hasCallbackData: !!(tx.callbackData || tx.callbackMetadata),
        merchantId: tx.merchantId,
        CheckoutRequestID: tx.CheckoutRequestID || tx.mpesaResponse?.CheckoutRequestID,
        createdAt: tx.createdAt,
        isValidMerchant: tx.isValidMerchant,
        paymentType: tx.paymentType,
        source: tx.source,
        // NEW: QR information
        hasQRData: !!tx.qrData,
        qrType: tx.qrData?.type || null,
        name: tx.qrData?.name || tx.name || null
      }));

    const debugInfo = {
      merchantId,
      totalTransactions: allTransactions.length,
      merchantTransactions: merchantTransactions.length,
      fieldIssues,
      statusDistribution,
      paymentTypeDistribution,
      recentTransactions,
      merchantLinking: {
        validMerchantTransactions: fieldIssues.validMerchantTransactions,
        guestTransactions: fieldIssues.guestTransactions,
        totalLinked: fieldIssues.validMerchantTransactions + fieldIssues.guestTransactions,
        linkingHealthPercentage: allTransactions.length > 0 ? 
          (fieldIssues.validMerchantTransactions / allTransactions.length * 100).toFixed(1) : 0,
        recommendation: fieldIssues.guestTransactions > fieldIssues.validMerchantTransactions ? 
          'Most transactions are guest transactions - consider promoting QR generation feature to merchants' :
          'Good merchant linking - most transactions are from registered merchants'
      },
      // NEW: QR Diagnostics
      qrDiagnostics: {
        totalQRTransactions: fieldIssues.qrTransactions,
        qrAdoptionRate: allTransactions.length > 0 
          ? (fieldIssues.qrTransactions / allTransactions.length * 100).toFixed(1) + '%'
          : '0%',
        qrHealthIssues: {
          qrWithoutMetadata: fieldIssues.qrWithoutMetadata,
          incompleteQRData: fieldIssues.incompleteQRData
        },
        qrSources: {
          customerScanned: allTransactions.filter(t => t.source === 'qr_scanner').length,
          merchantGenerated: allTransactions.filter(t => t.source === 'qr_generated').length
        },
        qrRecommendation: fieldIssues.qrTransactions === 0 
          ? 'No QR transactions found - promote QR code features to merchants and customers'
          : fieldIssues.qrTransactions < allTransactions.length * 0.1
          ? 'Low QR adoption - consider improving QR code visibility and education'
          : 'Good QR adoption - continue promoting QR features'
      }
    };

    console.log(`Enhanced debug completed: ${merchantTransactions.length} merchant transactions, ${fieldIssues.qrTransactions} QR transactions`);

    res.status(200).json({
      status: 'success',
      debug: debugInfo
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: `Debug failed: ${error.message}`,
      merchantId 
    });
  }
}

// ENHANCED: Get all transactions for a merchant with QR insights
async function getMerchantAllTransactions(req, res) {
  const merchantId = req.user.uid;
  const { 
    period = 'all', 
    status, 
    startDate, 
    endDate, 
    limit = 100,
    includeQRMetrics = true
  } = req.query;

  try {
    console.log(`getMerchantAllTransactions - merchant: ${merchantId}, includeQRMetrics: ${includeQRMetrics}`);

    // Calculate date range for filtering
    const now = new Date();
    let filterDate = null;
    let endFilterDate = null;

    if (period === 'custom' && startDate && endDate) {
      filterDate = new Date(startDate);
      filterDate.setHours(0, 0, 0, 0);
      
      endFilterDate = new Date(endDate);
      endFilterDate.setHours(23, 59, 59, 999);
    } else if (period !== 'all') {
      filterDate = new Date();
      switch (period) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          endFilterDate = new Date();
          endFilterDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
    }

    // Build queries
    let realMerchantQuery = db.collection("transactions")
      .where("merchantId", "==", merchantId);

    let guestMerchantQuery = db.collection("transactions")
      .where("guestMerchantInfo.originalMerchantId", "==", merchantId);

    // Apply date filtering if needed
    if (filterDate && period !== 'all') {
      const startTimestamp = admin.firestore.Timestamp.fromDate(filterDate);
      realMerchantQuery = realMerchantQuery.where("createdAt", ">=", startTimestamp);
      guestMerchantQuery = guestMerchantQuery.where("createdAt", ">=", startTimestamp);
      
      if (endFilterDate) {
        const endTimestamp = admin.firestore.Timestamp.fromDate(endFilterDate);
        realMerchantQuery = realMerchantQuery.where("createdAt", "<=", endTimestamp);
        guestMerchantQuery = guestMerchantQuery.where("createdAt", "<=", endTimestamp);
      }
    }

    // Apply limits
    realMerchantQuery = realMerchantQuery.limit(parseInt(limit));
    guestMerchantQuery = guestMerchantQuery.limit(parseInt(limit));

    // Execute queries with fallback
    console.log("Testing database connection...");
const testCol = await db.collection('transactions').limit(1).get();
console.log("Test Collection exists:", !testCol.empty || testCol.size === 0 ? "Yes" : "No");
    const [realTransactions, guestTransactions] = await executeQueriesWithFallback(
      realMerchantQuery, guestMerchantQuery, period, filterDate, endFilterDate
    );

    // Combine and deduplicate transactions
    const allTransactionDocs = [
      ...realTransactions.docs,
      ...guestTransactions.docs.filter(doc => 
        !realTransactions.docs.some(realDoc => realDoc.id === doc.id)
      )
    ];

    console.log(`Found ${realTransactions.docs.length} real + ${guestTransactions.docs.length} guest = ${allTransactionDocs.length} total transactions`);

    //  ENHANCED: Map and serialize transactions with QR metadata
    let transactions = allTransactionDocs.map(doc => {
      const data = doc.data();
      return serializeTransaction({
        id: doc.id,
        ...data,
        merchantValidation: {
          isValid: data.isValidMerchant || false,
          merchantType: data.isValidMerchant ? 'registered' : 'guest',
          paymentType: data.paymentType || 'unknown',
          source: data.source || 'unknown'
        },
        qrMetadata: includeQRMetrics === 'true' ? {
          hasQRData: !!data.qrData,
          qrSource: data.source === 'qr_scanner' ? 'customer_scanned' : 
                   data.source === 'qr_generated' ? 'merchant_generated' : 'none',
          qrType: data.qrData?.type || data.qrMetadata?.qrType || null,
          name: data.qrData?.name || data.name || null
        } : undefined
      });
    });

    // Apply status filtering
    if (status && status !== 'all') {
      transactions = transactions.filter(t => t.status === status);
    }

    // Sort by creation date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ENHANCED: Calculate summary statistics with QR insights
    const qrTransactions = transactions.filter(t => t.qrMetadata?.hasQRData);
    const summary = {
      total: transactions.length,
      successful: transactions.filter(t => t.status === 'success').length,
      pending: transactions.filter(t => t.status === 'pending').length,
      failed: transactions.filter(t => ['failed', 'cancelled', 'error'].includes(t.status)).length,
      totalRevenue: transactions
        .filter(t => t.status === 'success')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      realMerchantTransactions: transactions.filter(t => t.merchantValidation?.isValid === true).length,
      guestTransactions: transactions.filter(t => t.merchantValidation?.isValid === false).length,
      // NEW: QR metrics
      qrMetrics: includeQRMetrics === 'true' ? {
        totalQRTransactions: qrTransactions.length,
        qrRevenue: qrTransactions.filter(t => t.status === 'success').reduce((sum, t) => sum + (t.amount || 0), 0),
        customerScannedQR: transactions.filter(t => t.qrMetadata?.qrSource === 'customer_scanned').length,
        merchantGeneratedQR: transactions.filter(t => t.qrMetadata?.qrSource === 'merchant_generated').length,
        qrSuccessRate: qrTransactions.length > 0 
          ? (qrTransactions.filter(t => t.status === 'success').length / qrTransactions.length * 100).toFixed(1) + '%'
          : '0%'
      } : undefined
    };

    console.log(`Returning ${transactions.length} transactions (${qrTransactions.length} QR) for merchant ${merchantId}`);

    res.status(200).json({
      status: 'success',
      transactions,
      summary,
      metadata: {
        merchantId,
        filters: { period, status, includeQRMetrics },
        totalReturned: transactions.length,
        directTransactions: realTransactions.docs.length,
        guestTransactions: guestTransactions.docs.length,
        queryTimestamp: new Date().toISOString(),
        queryMethod: period === 'all' ? 'direct' : 'fallback-safe'
      }
    });

  } catch (error) {
    console.error('getMerchantAllTransactions error:', error);
    res.status(500).json({ 
      error: `Failed to get merchant transactions: ${error.message}`,
      merchantId 
    });
  }
}

// ENHANCED: Update transaction status with QR logging
async function updateTransactionStatus(req, res) {
  const { transactionId } = req.params;
  const { status, reason } = req.body;
  const merchantId = req.user.uid;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  const validStatuses = ['pending', 'success', 'failed', 'cancelled', 'error'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const transactionRef = db.collection("transactions").doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (!transactionDoc.exists) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const transaction = transactionDoc.data();

    // Verify merchant owns this transaction
    const belongsToMerchant = transaction.merchantId === merchantId ||
      (transaction.guestMerchantInfo?.originalMerchantId === merchantId);

    if (!belongsToMerchant) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update transaction
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastStatusUpdate: {
        status,
        reason: reason || 'Manual update by merchant',
        updatedBy: merchantId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        wasQRTransaction: !!transaction.qrData // Track if this was a QR transaction
      }
    };

    await transactionRef.update(updateData);

    const qrInfo = transaction.qrData ? ` (QR: ${transaction.qrData.type || 'unknown'})` : '';
    console.log(`Transaction ${transactionId} status updated to ${status} by merchant ${merchantId}${qrInfo}`);

    // Return updated transaction
    const updatedDoc = await transactionRef.get();
    const updatedTransaction = serializeTransaction({
      id: updatedDoc.id,
      ...updatedDoc.data(),
      merchantValidation: {
        isValid: transaction.isValidMerchant || false,
        merchantType: transaction.isValidMerchant ? 'registered' : 'guest',
        paymentType: transaction.paymentType || 'unknown',
        source: transaction.source || 'unknown'
      },
      qrMetadata: {
        hasQRData: !!transaction.qrData,
        qrSource: transaction.source === 'qr_scanner' ? 'customer_scanned' : 
                 transaction.source === 'qr_generated' ? 'merchant_generated' : 'none'
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Transaction status updated successfully',
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ 
      error: `Failed to update transaction: ${error.message}` 
    });
  }
}

// NEW: Get QR-specific transaction insights
async function getQRTransactionInsights(req, res) {
  const merchantId = req.user.uid;
  const { period = 'week', detailed = false } = req.query;

  try {
    console.log(`📱 QR Insights request - merchant: ${merchantId}, period: ${period}`);

    // Calculate date range
    const now = new Date();
    let queryStartDate = new Date();
    
    switch (period) {
      case 'today':
        queryStartDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        queryStartDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        queryStartDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        queryStartDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        queryStartDate = new Date('2020-01-01');
        break;
    }

    // Query transactions
    const snapshot = await db.collection("transactions")
      .where("merchantId", "==", merchantId)
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(queryStartDate))
      .limit(500)
      .get();

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter QR transactions
    const qrTransactions = transactions.filter(t => !!t.qrData);
    const nonQrTransactions = transactions.filter(t => !t.qrData);

    // Calculate insights
    const insights = {
      period,
      totalTransactions: transactions.length,
      qrTransactions: {
        count: qrTransactions.length,
        percentage: transactions.length > 0 
          ? (qrTransactions.length / transactions.length * 100).toFixed(1)
          : 0,
        revenue: qrTransactions
          .filter(t => t.status === 'success')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        averageAmount: qrTransactions.length > 0
          ? (qrTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) / qrTransactions.length).toFixed(2)
          : 0,
        successRate: qrTransactions.length > 0
          ? (qrTransactions.filter(t => t.status === 'success').length / qrTransactions.length * 100).toFixed(1)
          : 0
      },
      comparison: {
        nonQrTransactions: nonQrTransactions.length,
        qrVsNonQrSuccessRate: {
          qr: qrTransactions.length > 0
            ? (qrTransactions.filter(t => t.status === 'success').length / qrTransactions.length * 100).toFixed(1)
            : 0,
          nonQr: nonQrTransactions.length > 0
            ? (nonQrTransactions.filter(t => t.status === 'success').length / nonQrTransactions.length * 100).toFixed(1)
            : 0
        }
      },
      recommendations: []
    };

    // Add recommendations
    if (qrTransactions.length === 0) {
      insights.recommendations.push({
        type: 'adoption',
        message: 'Consider creating QR codes for your business to enable quick customer payments',
        priority: 'high'
      });
    } else if (qrTransactions.length < transactions.length * 0.2) {
      insights.recommendations.push({
        type: 'promotion',
        message: 'QR adoption is low. Display QR codes prominently to encourage customer usage',
        priority: 'medium'
      });
    }

    if (detailed === 'true') {
      insights.qrTypes = {};
      qrTransactions.forEach(t => {
        const type = t.qrData?.type || 'unknown';
        if (!insights.qrTypes[type]) {
          insights.qrTypes[type] = { count: 0, revenue: 0 };
        }
        insights.qrTypes[type].count++;
        if (t.status === 'success') {
          insights.qrTypes[type].revenue += t.amount || 0;
        }
      });
    }

    res.status(200).json({
      status: 'success',
      insights
    });

  } catch (error) {
    console.error('QR Insights error:', error);
    res.status(500).json({ error: `Failed to get QR insights: ${error.message}` });
  }
}

export  {
  createTransaction,
  getTransactions,
  getTransactionAnalytics,
  getTransactionById,
  getTransactionByCheckoutRequestID,
  debugTransactions,
  getMerchantAllTransactions,
  updateTransactionStatus,
  getQRTransactionInsights // NEW: QR-specific insights endpoint
};