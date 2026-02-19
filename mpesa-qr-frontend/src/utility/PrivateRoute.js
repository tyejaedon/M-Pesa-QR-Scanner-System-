import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // 1. Critical: Wait for Firebase and Backend Verification
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-500">Verifying session...</p>
      </div>
    );
  }

  // 2. If not logged in, boot them to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. The "Self-Healing" logic:
  // If you have children (passed manually), render them.
  // Otherwise, render the Outlet (for nested App.js routes).
  return children ? children : <Outlet />;
};

export default PrivateRoute;