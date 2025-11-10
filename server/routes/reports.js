import express from 'express';
import jwt from 'jsonwebtoken';
import Report from '../models/Report.js';

const router = express.Router();

// Helper function to verify token (optional - allows anonymous reports)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid, but allow request to continue (anonymous report)
      req.user = null;
    }
  }
  next();
};

// GET /api/reports - Fetch all reports
router.get('/', verifyToken, async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 }) // Most recent first
      .limit(1000) // Limit to prevent huge responses
      .lean(); // Return plain objects for better performance

    // Format response to match frontend expectations
    return res.json({
      reports: reports.map(report => ({
        id: report._id.toString(),
        title: report.title,
        description: report.description,
        type: report.type,
        location: report.location,
        lat: report.lat,
        lng: report.lng,
        verified: report.verified || false,
        createdAt: report.createdAt,
        username: report.username || 'Anonymous',
        userId: report.userId ? report.userId.toString() : null
      }))
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ 
      message: 'Server error fetching reports', 
      error: error.message 
    });
  }
});

// GET /api/reports/my-reports - Fetch current user's reports
router.get('/my-reports', verifyToken, async (req, res) => {
  try {
    // Require authentication for this endpoint
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'Authentication required to view your reports' 
      });
    }

    const reports = await Report.find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(1000)
      .lean();

    // Format response
    return res.json({
      reports: reports.map(report => ({
        id: report._id.toString(),
        title: report.title,
        description: report.description,
        type: report.type,
        location: report.location,
        lat: report.lat,
        lng: report.lng,
        verified: report.verified || false,
        createdAt: report.createdAt,
        username: report.username || 'Anonymous'
      }))
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return res.status(500).json({ 
      message: 'Server error fetching your reports', 
      error: error.message 
    });
  }
});

// POST /api/reports - Submit new report
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, type, location, lat, lng } = req.body;

    // Validation
    if (!title || !description || !type || !location) {
      return res.status(400).json({ 
        message: 'Please provide title, description, type, and location' 
      });
    }

    if (lat === undefined || lng === undefined || lat === null || lng === null) {
      return res.status(400).json({ 
        message: 'Please provide valid latitude and longitude coordinates' 
      });
    }

    // Validate coordinates are numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        message: 'Latitude and longitude must be valid numbers' 
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        message: 'Invalid coordinate values' 
      });
    }

    // Create new report
    const reportData = {
      title: title.trim(),
      description: description.trim(),
      type: type.trim(),
      location: location.trim(),
      lat: latitude,
      lng: longitude,
      verified: false
    };

    // Add user info if authenticated
    if (req.user) {
      reportData.userId = req.user.id;
      reportData.username = req.user.username;
    }

    const report = new Report(reportData);
    await report.save();

    // Return formatted response
    return res.status(201).json({
      message: 'Report submitted successfully',
      report: {
        id: report._id.toString(),
        title: report.title,
        description: report.description,
        type: report.type,
        location: report.location,
        lat: report.lat,
        lng: report.lng,
        verified: report.verified,
        createdAt: report.createdAt,
        username: report.username || 'Anonymous'
      }
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    return res.status(500).json({ 
      message: 'Server error submitting report', 
      error: error.message 
    });
  }
});

export default router;

