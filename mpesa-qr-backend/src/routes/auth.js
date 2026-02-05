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

export default router;