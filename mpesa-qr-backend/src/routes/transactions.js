import express from"express";

import { verifyToken } from "../middlewares/auth.js";
import { 
  createTransaction, 
  getTransactions, 
  getTransactionById, 
  getTransactionAnalytics,
  debugTransactions,
  getAllTransactionsGlobal,
  getMerchantAllTransactions // ✅ NEW: Import the new function
} from "../controllers/transactions.js";

const router = express.Router();

router.post("/", verifyToken, createTransaction);
router.get("/", verifyToken, getTransactions);
router.get("/analytics", verifyToken, getTransactionAnalytics);
router.get("/debug", verifyToken, debugTransactions);
// Add this to your route definitions
router.get('/all-transactions', getAllTransactionsGlobal);
// ✅ NEW: Enhanced endpoint for getting all merchant transactions
router.get("/all", verifyToken, getMerchantAllTransactions);

router.get("/:transactionId", verifyToken, getTransactionById);
router.get('/:id', verifyToken, getTransactionById);

export default router;