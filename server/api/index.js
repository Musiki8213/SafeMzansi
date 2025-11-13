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

// Base API route - handle root path (Vercel routes /api to this function)
app.get('/', (req, res) => {
  res.json({ message: 'SafeMzansi backend is running' });
});

// Also handle /api explicitly (in case Vercel doesn't strip it)
app.get('/api', (req, res) => {
  res.json({ message: 'SafeMzansi backend is running' });
});

// Auth routes - Vercel routes /api/* to this function, so paths are relative
// Access as: https://your-project.vercel.app/api/register
app.use('/api', authRoutes);
app.use('/', authRoutes); // Also handle without /api prefix

// Reports routes
app.use('/api/reports', reportsRoutes);
app.use('/reports', reportsRoutes); // Also handle without /api prefix

// Notifications routes
app.use('/api/notifications', notificationsRoutes);
app.use('/notifications', notificationsRoutes); // Also handle without /api prefix

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
