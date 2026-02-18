import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { 
  onAuthStateChanged as firebaseOnAuthStateChanged, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { auth } from '../firebase'; 
import axios from 'axios';
import { API_BASE_URL } from '../utility/constants';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // This is the data causing the loop - we need to manage it carefully
  const [merchantData, setMerchantData] = useState(null);

  useEffect(() => {
    console.log("🔄 AuthProvider: Initializing listener...");
    
    const unsubscribe = firebaseOnAuthStateChanged(auth, async (currentUser) => {
      // 1. Set the Firebase Auth user first
      setUser(currentUser);
      
      if (currentUser) {
        try {
          console.log("🔍 AuthProvider: User detected, fetching merchant profile...");
          const idToken = await currentUser.getIdToken();
          
          // 2. Verify with your backend
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/verify-token`,
            { idToken },
            {
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
              }
            }
          );
          
          if (response.data?.user) {
            console.log("✅ AuthProvider: Merchant profile loaded.");
            setMerchantData(response.data.user);
          }
        } catch (error) {
          console.error('⚠️ AuthProvider: Error fetching merchant data:', error);
          // Self-healing: User is logged in to Firebase, but backend failed.
          // We keep user true, but merchantData null. 
          // Your dashboard should handle "Loading Profile..." if user exists but merchantData doesn't.
          setMerchantData(null);
        }
      } else {
        console.log("👋 AuthProvider: User logged out.");
        setMerchantData(null);
      }
      
      // 3. Finalize loading
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setMerchantData(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // --- CRITICAL FIX: MEMOIZATION ---
  const value = useMemo(() => ({
    user,           // The Firebase Object
    merchantData,   // The Database Object (Missing in your previous code!)
    loading,
    setMerchantData, // Expose setter so Login.jsx can update it manually
    logout
  }), [user, merchantData, loading]); 

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}