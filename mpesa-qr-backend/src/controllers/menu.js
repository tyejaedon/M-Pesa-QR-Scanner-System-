import { db } from '../config/firebase.js';


import menuSchema from '../databases/schemas/menuSchema.json'with { type: 'json' };

/**
 * Strict Schema Validation
 * Ensures data integrity before hitting Firestore
 */
const validateItem = (item) => {
    const sanitized = {};
    for (const [key, rules] of Object.entries(menuSchema.fields)) {
        let value = item[key];

        // 1. Requirement Check
        if (rules.required && (value === undefined || value === null || value === '')) {
            throw new Error(`Validation Error: '${key}' is required.`);
        }

        // 2. Type Casting & Normalization
        if (rules.type === 'number') value = Number(value);
        if (rules.type === 'boolean') value = (value === 'true' || value === true);

        // 3. Range/Type Validation
        if (rules.type === 'number' && (isNaN(value) || value < 0)) {
            throw new Error(`Validation Error: '${key}' must be a non-negative number.`);
        }
        
        sanitized[key] = value ?? rules.default;
    }
    // Consistent timestamping for analytics
    sanitized.updatedAt = new Date().toISOString();
    return sanitized;
};

// --- CORE API FUNCTIONS ---

/**
 * 1. Get Menu (Public/Private)
 * Anyone can view, but fetching by merchantId ensures context isolation.
 */
export const getMenu = async (req, res) => {
    try {
        const { merchantId } = req.params;
        const snapshot = await db.collection('merchants').doc(merchantId).collection('menu').get();
        
        const menu = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({ success: true, count: menu.length, menu });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching menu", error: error.message });
    }
};

/**
 * 2. Save/Sync Menu (Atomic Bulk Update)
 * Uses verifyToken to ensure only the owner can modify.
 */
export const saveMenu = async (req, res) => {
    const batch = db.batch();
    try {
        const authId = req.user.uid; // Secured from verifyToken
        const { items } = req.body; 

        if (!Array.isArray(items)) throw new Error("Items must be an array.");

        const menuRef = db.collection('merchants').doc(authId).collection('menu');

        // Step A: Wipe old menu items within the same atomic batch
        const existingDocs = await menuRef.get();
        existingDocs.forEach(doc => batch.delete(doc.ref));

        // Step B: Validate and Add new items
        items.forEach(item => {
            const sanitized = validateItem(item);
            const newDocRef = menuRef.doc(); // Auto-generate ID
            batch.set(newDocRef, sanitized);
        });

        await batch.commit();
        res.status(200).json({ success: true, message: "Menu synced successfully" });
    } catch (error) {
        console.error(`❌ Sync Error for ${req.user?.uid}:`, error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * 3. Toggle Availability
 * Precise update for single fields.
 */
export const toggleItemAvailability = async (req, res) => {
    try {
        const authId = req.user.uid;
        const { itemId } = req.params;
        const { isAvailable } = req.body;

        const itemRef = db.collection('merchants').doc(authId).collection('menu').doc(itemId);
        
        await itemRef.update({ 
            isAvailable: Boolean(isAvailable), 
            updatedAt: new Date().toISOString() 
        });

        res.status(200).json({ success: true, message: "Availability updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 4. Delete Single Item
 */
export const deleteMenuItem = async (req, res) => {
    try {
        const authId = req.user.uid;
        const { itemId } = req.params;

        await db.collection('merchants').doc(authId).collection('menu').doc(itemId).delete();
        
        res.status(200).json({ success: true, message: "Item removed" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 5. Recursive Menu Wipeout
 * Nuclear option for merchants resetting their shop.
 */
export const deleteAllMenu = async (req, res) => {
    const batch = db.batch();
    try {
        const authId = req.user.uid; 
        const menuRef = db.collection('merchants').doc(authId).collection('menu');
        const snapshot = await menuRef.get();

        if (snapshot.empty) return res.status(200).json({ success: true, message: "Already empty" });

        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        res.status(200).json({ success: true, message: "Entire menu wiped successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Wipeout failed", error: error.message });
    }
};