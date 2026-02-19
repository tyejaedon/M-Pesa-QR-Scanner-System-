import { db } from '../config/firebase.js';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export const SubscriptionManager = {
  
  /**
   * 1. ONBOARDING: Global 14-Day Trial
   * Standardizes the trial for the Tier and the Addon simultaneously.
   */
  async onboardMerchant(merchantId) {
    const merchantRef = doc(db, 'merchants', merchantId);
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 14);

    await updateDoc(merchantRef, {
      'subscription.tier': 'BASIC',
      'subscription.status': 'TRIALING',
      'subscription.expiry': Timestamp.fromDate(trialExpiry),
      
      'addons.menuEnabled': true,
      'addons.menuTrialEnd': Timestamp.fromDate(trialExpiry),
      
      'metadata.isBoarded': true,
      'metadata.lastLogin': serverTimestamp()
    });
  },

  /**
   * 2. TIER RENEWAL: BASIC or ELITE
   * Updates the core subscription without touching the Addon status.
   */
  async renewTier(merchantId, planTier = 'BASIC') {
    const merchantRef = doc(db, 'merchants', merchantId);
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);

    await updateDoc(merchantRef, {
      'subscription.tier': planTier,
      'subscription.status': 'ACTIVE',
      'subscription.expiry': Timestamp.fromDate(newExpiry),
      'metadata.lastLogin': serverTimestamp()
    });
  },

  /**
   * 3. MENU ADDON ACTIVATION
   * Can be called regardless of whether the user is BASIC or ELITE.
   */
  async toggleMenuAddon(merchantId, enable = true) {
    const merchantRef = doc(db, 'merchants', merchantId);
    await updateDoc(merchantRef, {
      'addons.menuEnabled': enable,
      // If enabling, you might want to set a specific addon expiry
      'addons.menuTrialEnd': enable ? null : serverTimestamp() 
    });
  },

  /**
   * 4. GLOBAL EXPIRY
   * Typically called when the main subscription lapses.
   */
  async setExpired(merchantId) {
    const merchantRef = doc(db, 'merchants', merchantId);
    await updateDoc(merchantRef, {
      'subscription.status': 'EXPIRED',
      'addons.menuEnabled': false // Usually, addons lapse if the base sub is gone
    });
  }
};