import { admin } from '../config/firebase.js';

/**
 * Checks if a merchant's subscription is still valid based on the expiry timestamp.
 * @param {string} merchantId - The UID from the decoded token
 * @returns {object} { hasAccess, tier, status }
 */
async function checkSubscriptionAccess(merchantId) {
  try {
    const db = admin.firestore();
    const merchantDoc = await db.collection('merchants').doc(merchantId).get();

    if (!merchantDoc.exists) {
      return { hasAccess: false, reason: 'Merchant profile not found' };
    }

    const data = merchantDoc.data();
    const sub = data.subscription;

    // Guard clause: Ensure subscription data actually exists
    if (!sub || !sub.expiry) {
      return { hasAccess: false, reason: 'Missing subscription data' };
    }

    // Convert Firestore Admin Timestamp to standard JavaScript Date
    const expiryDate = sub.expiry.toDate();
    const now = new Date();

    // The Core Logic
    const isExpired = now > expiryDate;

    return {
      hasAccess: !isExpired,
      tier: sub.tier, // 'BASIC' or 'ELITE'
      status: isExpired ? 'EXPIRED' : sub.status,
      menuEnabled: data.addons?.menuEnabled || false
    };

  } catch (error) {
    console.error('❌ Subscription Check Error:', error);
    return { hasAccess: false, reason: 'Database error during verification' };
  }
}



/**
 * Middleware to verify Firebase ID Tokens
 */

async function verifyToken(req, res, next) {
  // 1. Grab the token from the Authorization header
  const authHeader = req.headers.authorization;
  
  // Optimization: Ensure header starts with 'Bearer ' to avoid split errors
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error("⚠️ No Bearer token found in request headers");
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // 2. Cryptographic check via Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    

    // 3. Attach the user data to the request object
    // This allows you to access req.user.uid in your analytics routes
    req.user = decodedToken;
    
    // 4. Move to the next function
    next();
  } catch (error) {
    console.error("❌ Firebase Verification Error:", error.code, error.message);

    // FIX: Removed the extra backticks and cleaned up the response logic
    let message = 'Unauthorized: Invalid token';
    
    if (error.code === 'auth/id-token-expired') {
      message = 'Token expired. Please login again.';
    } else if (error.code === 'auth/argument-error') {
      message = 'Malformed token.';
    }

    res.status(401).json({ error: message });
  }
}

export { verifyToken };