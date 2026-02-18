import { admin } from '../config/firebase.js';

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