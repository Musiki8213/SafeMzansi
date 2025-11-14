import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import reportsRoutes from './routes/reports.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Enable CORS and JSON parsing
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });

// Base API route
app.get('/api', (req, res) => {
  res.json({ message: 'SafeMzansi backend is running' });
});

// Auth routes - Import and use authRoutes
app.use('/api', authRoutes);

// Reports routes - Import and use reportsRoutes
app.use('/api/reports', reportsRoutes);

// Error handling middleware for JSON responses
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error' 
  });
});

// 404 handler - Ensure JSON response
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Export app for Vercel serverless functions
export default app;

// Start server only if not in serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
