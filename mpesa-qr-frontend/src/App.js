import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

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

// Utilities
import PrivateRoute from './utility/PrivateRoute';

function App() {
  // State for manual status tracking if you prefer mimicking your other project
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // Function to be called by Login child to update parent state
  const handleLoginSuccess = (status, data) => {
    setIsLoggedIn(status);
    setUserData(data);
  };

  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Auth Routes */}
          <Route 
            path="/login" 
            element={<Login onLoginSuccess={handleLoginSuccess} />} 
          />
          <Route path="/register" element={<Register />} />
          
          {/* Public Routes */}
          <Route path="/scan" element={<PublicQRScanner />} />
          <Route path="/pay" element={<PayPrompt />} />
          <Route path="/public/menu/:merchantId" element={<PublicMenuPage />} />
          
          {/* Protected Routes Group */}
          <Route element={<PrivateRoute />}>
          {console.log('🔐 Accessing protected routes, isLoggedIn:', userData)}
            <Route path="/dashboard" element={<MerchantDashboard />} />
            <Route path="/generate-qr" element={<MerchantQRGenerator />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/payment-scanner" element={<QRPaymentScanner />} />
          </Route>
          
          {/* Fallback Redirection */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;