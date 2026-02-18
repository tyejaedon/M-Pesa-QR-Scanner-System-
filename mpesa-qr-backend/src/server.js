// This is the main server file for the M-Pesa QR Backend API
// It sets up the Express server and routes
//Thus the use of express 5 compatible syntax and middleware

import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { db,admin } from './config//firebase.js';
const app = express();

// Import routes
import authRoutes from './routes/auth.js';
import darajaRoutes from './routes/daraja.js';
import transactionRoutes from './routes/transactions.js';
import qrPayRouter from './routes/qrPay.js';
import menuRoutes from './routes/menu.js'; 

app.use(qrPayRouter);

// Enhanced CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for mobile testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'ngrok-skip-browser-warning',
    'Accept'
  ],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Routes - Fix the route mounting to include /api prefix
app.use('/api/auth', authRoutes);          // Authentication routes
app.use('/api/daraja', darajaRoutes);      // M-Pesa routes  
app.use('/api/transactions', transactionRoutes); // Transaction routes
app.use('/api/menu', menuRoutes);         // Menu management routes



app.get('/', (req, res) => {
  res.json({ 
    message: 'M-Pesa QR Backend API',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth',
      daraja: '/api/daraja',
      transactions: '/api/transactions'
    }
  });
});

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'M-Pesa QR Backend API',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth',
      daraja: '/api/daraja',
      transactions: '/api/transactions'
    }
  });
});
app.get('/list-collections', async (req, res) => {
  try {
    // This will tell us exactly which project Node is looking at
    const projectId = admin.apps[0].options.projectId || "Unknown";
    console.log(`Checking collections for project: ${projectId}`);

    const collections = await db.listCollections();
    const collectionIds = collections.map(col => col.id);
    
    res.json({ 
      success: true, 
      projectId: projectId,
      foundCollections: collectionIds 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Could not list collections",
      error: error.message 
    });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    routes: {
      auth: '/api/auth',
      daraja: '/api/daraja',
      transactions: '/api/transactions'
    }
  });
});
app.get('/list-collections', async (req, res) => {
  try {
    // This method asks the Firestore database to reveal all its secrets
    const collections = await db.listCollections();
    const collectionIds = collections.map(col => col.id);
    
    res.json({ 
      success: true, 
      foundCollections: collectionIds 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Could not list collections",
      error: error.message 
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    error: "Something went wrong!",
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler - Fixed for Express 5 compatibility
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`💰 M-Pesa routes: http://localhost:${PORT}/api/daraja`);
  console.log(`📊 Transaction routes: http://localhost:${PORT}/api/transactions`);
});

export default app;