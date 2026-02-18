import { db } from '../config/firebase.js';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const SubscriptionManager = {
  // 1. Onboarding: Set up initial trial
  async onboardMerchant(merchantId) {
    const merchantRef = doc(db, 'merchants', merchantId);
    await updateDoc(merchantRef, {
      subscription: {
        tier: 'tier1',
        status: 'trialing',
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      },
      addons: { menuEnabled: true } // Give them a taste of the Menu addon
    });
  },

  // 2. Renewal: After M-Pesa payment confirmation
  async renewSubscription(merchantId, planType = 'tier2') {
    const merchantRef = doc(db, 'merchants', merchantId);
    await updateDoc(merchantRef, {
      'subscription.tier': planType,
      'subscription.status': 'active',
      'subscription.currentPeriodEnd': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
  },

  // 3. Expiry/Opt-out: Downgrade or Lock
  async setExpired(merchantId) {
    const merchantRef = doc(db, 'merchants', merchantId);
    await updateDoc(merchantRef, {
      'subscription.status': 'expired',
      'addons.menuEnabled': false // Revoke addon access
    });
  }
};