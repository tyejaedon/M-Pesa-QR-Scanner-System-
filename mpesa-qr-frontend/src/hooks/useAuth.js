import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged as firebaseOnAuthStateChanged, 
  signOut as firebaseSignOut 
} from "firebase/auth";
// Ensure this path points to your refined firebase.js
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
    const unsubscribe = firebaseOnAuthStateChanged(auth, async (currentUser) => {
      // 1. Set the Firebase Auth user first
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          // 2. Verify with your backend to get Merchant details (Shortcode, etc.)
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
            setMerchantData(response.data.user);
          }
        } catch (error) {
          console.error('Error fetching merchant data:', error);
          // If the backend fails, the user is 'authenticated' but has no 'merchantData'
          // This is where your 'Self-Healing' logic lives!
          setMerchantData(null);
        }
      } else {
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

  const value = {
    user,
    loading,
    merchantData,
    setMerchantData,
    logout,
    isAuthenticated: !!user && !!merchantData // Stronger check
  };

return (
  <AuthContext.Provider value={value}>
    {loading ? (
       <div className="loading-screen">Loading...</div> // Stable placeholder
    ) : (
       children
    )}
  </AuthContext.Provider>
);
}