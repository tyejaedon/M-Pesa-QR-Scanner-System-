// API Configuration - Support both local and ngrok
const useNgrok = process.env.REACT_APP_USE_NGROK === 'true';
const ngrokUrl = process.env.REACT_APP_API_URL?.replace(/\/$/, ""); 
const localUrl = 'http://10.39.202.82:5000';


// Use the ngrok URL if enabled, otherwise stick to localhost

// IMPORTANT: Ensure your backend uses the /api prefix consistently
export const API_BASE_URL = localUrl;
// Payment Status Constants
export const STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  ERROR: 'error'
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    VERIFY: '/api/auth/verify-token'
  },
  // M-Pesa/Daraja endpoints (Matches daraja.js)
  MPESA: {
    CUSTOMER_PAYMENT: '/api/daraja/customer-payment', //
    MERCHANT_PAYMENT: '/api/daraja/stk-push',         //
    STK_PUSH: '/api/daraja/stk-push',                //
    CALLBACK: '/api/daraja/stk-callback',             //
    GENERATE_QR: '/api/daraja/generate-qr'            //
  },
  // Transaction endpoints (Matches transactions.js)
  TRANSACTIONS: {
    LIST: '/api/transactions',                        //
    ANALYTICS: '/api/transactions/analytics',         //
    GET_BY_ID: '/api/transactions/:id',               //
    QR_INSIGHTS: '/api/transactions/qr-insights'      //
  },
  HEALTH: {
    CHECK: '/api/daraja/health-check',                //
    TEST_TOKEN: '/api/daraja/test-token'              //
  }
};

// M-Pesa Configuration
export const MPESA_CONFIG = {
  TEST_PHONE: '254708374149',
  SANDBOX_SHORTCODE: '174379',
  PRODUCTION_BASE_URL: 'https://api.safaricom.co.ke',
  SANDBOX_BASE_URL: 'https://sandbox.safaricom.co.ke'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  INVALID_PHONE: 'Please enter a valid phone number in format 254XXXXXXXXX',
  INVALID_AMOUNT: 'Please enter a valid amount greater than 0',
  INVALID_QR: 'Invalid QR code format. Please scan a valid payment QR code.',
  QR_SCAN_FAILED: 'Failed to scan QR code. Please try again.',
  PAYMENT_FAILED: 'Payment initiation failed. Please try again.',
  AUTH_REQUIRED: 'Authentication required. Please login.',
  MERCHANT_NOT_FOUND: 'Merchant not found. Please register first.',
  SANDBOX_PHONE_ONLY: 'Sandbox only works with test number 254708374149'
};

// UI Configuration
export const UI_CONFIG = {
  POLLING_INTERVAL: 5000, // 5 seconds
  MAX_POLL_ATTEMPTS: 12,  // 1 minute total (5s * 12)
  PAYMENT_TIMEOUT: 60000, // 60 seconds
};

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  MERCHANT: 'merchant'
};