import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Initial state strictly following your merchant schema defaults
  const [subState, setSubState] = useState({
    tier: 'BASIC',
    status: 'TRIALING',
    isValid: false,
    menuEnabled: false,
    loading: true,
    metadata: { isBoarded: false }
  });

  useEffect(() => {
    if (!user) {
      setSubState(prev => ({ ...prev, loading: false }));
      return;
    }

    // ⚡️ Real-time listener on the Merchant Document
    const unsub = onSnapshot(doc(db, 'merchants', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const now = new Date();
        
        // 🛡️ Bulletproof Expiry Logic
        // We check if status is 'ACTIVE' OR if current time is before the 'expiry' timestamp
        const expiryDate = data.subscription?.expiry?.toDate();
        const isWithinTimeframe = expiryDate ? now < expiryDate : false;
        const statusActive = data.subscription?.status === 'ACTIVE';
        const isTrialing = data.subscription?.status === 'TRIALING';

        setSubState({
          // Primary Subscription Fields
          tier: data.subscription?.tier || 'BASIC',
          status: data.subscription?.status || 'EXPIRED',
          
          // Boolean Gates (Easier for UI logic)
          isValid: (statusActive || isTrialing) && isWithinTimeframe,
          
          // Addons
          menuEnabled: data.addons?.menuEnabled || false,
          
          // Metadata for onboarding flow
          isBoarded: data.metadata?.isBoarded || false,
          
          loading: false
        });
      } else {
        // Handle case where merchant doc doesn't exist yet (post-auth, pre-db setup)
        setSubState(prev => ({ ...prev, loading: false }));
      }
    }, (error) => {
      console.error("Subscription Sync Error:", error);
      setSubState(prev => ({ ...prev, loading: false }));
    });

    return () => unsub();
  }, [user]);

  return (
    <SubscriptionContext.Provider value={subState}>
      {!subState.loading && children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};