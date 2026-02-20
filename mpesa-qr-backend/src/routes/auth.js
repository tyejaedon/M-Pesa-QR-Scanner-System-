import express from 'express';
import { 
  createUserwithEmailandPaassword, 
  signInwithEmailandPassword, 
  fixIncompleteRegistration, 
  cleanupIncompleteUser, 
  checkUserStatus,
  diagnoseProblem,
  fixAllIncompleteUsers
} from "../controllers/auth.js";
import { verifyToken } from "../middlewares/auth.js";
import { db } from '../config/firebase.js';


const router = express.Router();

// Registration and login routes
router.post("/signup", createUserwithEmailandPaassword);
router.post("/login", signInwithEmailandPassword);

// Token verification route
router.post("/verify-token", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    user: req.user
  });
});

// Problem-solving routes
router.post("/fix-registration", fixIncompleteRegistration);
router.post("/cleanup-user", cleanupIncompleteUser);
router.post("/check-status", checkUserStatus);
router.post("/diagnose-problem", diagnoseProblem);
router.post("/fix-all-incomplete", fixAllIncompleteUsers);
// router.js
// New dedicated route
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // req.user was attached by the verifyToken middleware
    const merchantDoc = await db.collection('merchants').doc(req.user.uid).get();
    
    if (!merchantDoc.exists) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, user: merchantDoc.data() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;