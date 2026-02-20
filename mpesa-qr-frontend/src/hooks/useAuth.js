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
  const [merchantData, setMerchantData] = useState(null);

  useEffect(() => {
    const unsubscribe = firebaseOnAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // If no user is logged in, kill the loading state immediately
      if (!currentUser) {
        setMerchantData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchMerchantProfile = async () => {
      // 1. Only fetch if we have a Firebase session but no local profile yet
      if (!user) return;

      try {
        const idToken = await user.getIdToken();

        // 2. This hits your updated backend that now returns the FULL Firestore doc
        const response = await axios.get( // Changed to GET
          `${API_BASE_URL}/api/auth/profile`, // Changed to /profile
          {
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'ngrok-skip-browser-warning': 'true'
            }
          }
        );

        // 3. Update merchantData with the comprehensive profile from the backend
        if (response.data?.success && response.data?.user) {
          setMerchantData(response.data.user);
        }
      } catch (error) {
        console.error('⚠️ Merchant Profile Fetch Failed:', error.response?.data || error.message);
        // Fallback: If backend fails, we keep the user but set merchantData to null
        setMerchantData(null);
      } finally {
        // 4. Critical: Only set loading to false AFTER the profile attempt
        setLoading(false);
      }
    };

    fetchMerchantProfile();
  }, [user]);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setMerchantData(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = useMemo(() => ({
    user,
    merchantData,
    loading,
    setMerchantData, // Allows manual updates (e.g., after an upgrade)
    logout
  }), [user?.uid, merchantData, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}