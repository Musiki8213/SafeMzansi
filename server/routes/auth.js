import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Register route - POST /api/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation - ensure all fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists'
      });
    }
    
    // Create new user (password will be hashed by User model pre-save hook)
    const user = new User({
      username,
      email,
      password // Will be hashed using bcrypt in the pre-save hook
    });
    
    // Save user to MongoDB
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return JSON response
    return res.json({
      message: 'User registered successfully',
      token,
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle duplicate key errors (MongoDB)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'User already exists'
      });
    }
    
    // Handle other errors
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login route - POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation - ensure email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Check if user exists
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Compare password with bcrypt
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return JSON response
    return res.json({
      message: 'Login successful',
      token,
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// Profile route (protected) - GET /api/profile
router.get('/profile', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }
    
    // Extract and verify token
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
});

export default router;
