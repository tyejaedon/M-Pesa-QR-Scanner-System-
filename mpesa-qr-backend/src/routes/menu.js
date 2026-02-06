import express from 'express';
const router = express.Router();

// Import the middleware you already have in your auth system
import { verifyToken } from '../middlewares/auth.js'; 

import { 
    getMenu, 
    saveMenu, 
    toggleItemAvailability, 
    deleteMenuItem,
    deleteAllMenu 
} from '../controllers/menu.js';

/**
 * PUBLIC ROUTES
 * Customers need to see the menu without logging in
 */
router.get('/:merchantId', getMenu);

/**
 * PROTECTED ROUTES (Requires verifyToken)
 * Only the logged-in merchant can perform these actions
 */

// Bulk save/overwrite - verifyToken ensures the user is logged in
router.post('/save', verifyToken, saveMenu);

// Toggle status of one item
router.patch('/:merchantId/item/:itemId/status', verifyToken, toggleItemAvailability);

// Delete one specific item
router.delete('/:merchantId/item/:itemId', verifyToken, deleteMenuItem);

// Nuclear Option: Delete everything
router.delete('/:merchantId/wipe', verifyToken, deleteAllMenu);

export default router;