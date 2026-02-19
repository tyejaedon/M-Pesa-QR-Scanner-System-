import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// ... imports
import { AuthProvider, useAuth } from './hooks/useAuth'; // Import useAuth here

// Components
import Login from './components/Login';
import Register from './components/Register';
import MerchantDashboard from './components/MerchantDashboard';
import MerchantQRGenerator from './components/MerchantQRGenerator';
import PublicQRScanner from './components/PublicQRScanner';
import Transactions from './components/Transactions';
import QRPaymentScanner from './components/QRPaymentScanner';
import PayPrompt from "./components/PayPrompt";
import PublicMenuPage from './components/PublicMenuPage';
import LandingPage from './components/LandingPage';

// Utilities
import PrivateRoute from './utility/PrivateRoute';
import { SubscriptionProvider } from './hooks/SubscriptionProvider';
import { ThemeProvider } from './hooks/ThemeContext'; // Assuming you have this

// --- 1. NEW COMPONENT: HANDLES ROUTING LOGIC ---
const AppRoutes = () => {
  const { user, loading } = useAuth(); // Now we can use the hook!

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 1. Landing Page Redirect */}
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
      />

      {/* 2. Auth Routes (Redirect if already logged in) */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
      />

      {/* Public Routes */}
      <Route path="/scan" element={<PublicQRScanner />} />
      <Route path="/pay" element={<PayPrompt />} />
      <Route path="/public/menu/:merchantId" element={<PublicMenuPage />} />

      {/* Protected Routes Group */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<MerchantDashboard />} />
        <Route path="/generate-qr" element={<MerchantQRGenerator />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/payment-scanner" element={<QRPaymentScanner />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// --- 2. MAIN APP COMPONENT: WRAPS PROVIDERS ONLY ---
function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ThemeProvider> {/* Add ThemeProvider here if you use it */}
           <div className="App">
             <AppRoutes />
           </div>
        </ThemeProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;