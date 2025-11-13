// Vercel serverless function - Express app handler
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from '../routes/auth.js';
import reportsRoutes from '../routes/reports.js';
import notificationsRoutes from '../routes/notifications.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware - Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// MongoDB connection (only connect if not already connected)
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error.message);
    });
}

// Base API route
app.get('/api', (req, res) => {
  res.json({ message: 'SafeMzansi backend is running' });
});

// Auth routes
app.use('/api', authRoutes);

// Reports routes
app.use('/api/reports', reportsRoutes);

// Notifications routes
app.use('/api/notifications', notificationsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Export as Vercel serverless function
export default app;
