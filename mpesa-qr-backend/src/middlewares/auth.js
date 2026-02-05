import { admin } from '../config/firebase.js';

/**
 * Middleware to verify Firebase ID Tokens
 * This runs on the SERVER to protect your routes
 */
async function verifyToken(req, res, next) {
  // 1. Grab the token from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.split('Bearer ')[1];

  if (!token) {
    console.error("⚠️ No token found in request headers");
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // 2. Use Firebase Admin to verify the token directly
    // This doesn't need axios; it's a direct cryptographic check
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 3. Attach the user data to the request object
    req.user = decodedToken;
    console.log("✅ Token verified for user:", decodedToken.email);

    // 4. Move to the next function (the actual route logic)
    next();
  } catch (error) {
    console.error("❌ Token Verification Failed:", error.code, error.message);

    // Provide a helpful error message for debugging
    const message = error.code === 'auth/id-token-expired'
      ? 'Token expired. Please login again.'
      : 'Unauthorized: Invalid token'; `
      `
    console.error("❌ Firebase Verification Error:", error.code, error.message);
    res.status(401).json({ error: message });
  }
}

export { verifyToken };