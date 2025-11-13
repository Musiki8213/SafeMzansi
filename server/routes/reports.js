import express from 'express';
import jwt from 'jsonwebtoken';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

// Calculate distance between two points (Haversine formula) in meters
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// Create notifications for all other users when a new report is created
// All users (except the report creator) will receive notifications regardless of distance
const createNotificationsForNearbyUsers = async (report, reportLat, reportLng) => {
  try {
    // Get all users
    const users = await User.find({}).select('_id').lean();
    
    // Create notifications for all users except the report creator
    const notificationsToCreate = [];
    
    for (const user of users) {
      // Skip the user who created the report
      if (report.userId && user._id.toString() === report.userId.toString()) {
        continue;
      }
      
      // Create notification message - all users get notified regardless of distance
      // Use a generic message since we're not calculating actual distance
      const message = `⚠️ A ${report.type.toLowerCase()} was just reported near ${report.location}.`;
      
      notificationsToCreate.push({
        userId: user._id,
        reportId: report._id,
        type: report.type,
        message: message,
        location: report.location,
        lat: reportLat,
        lng: reportLng,
        distance: 0, // Distance not calculated - all users notified
        read: false
      });
    }
    
    // Bulk insert notifications
    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
      console.log(`Created ${notificationsToCreate.length} notifications for report ${report._id} - all users notified`);
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
    throw error;
  }
};

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
    if (!description || !type || !location) {
      return res.status(400).json({ 
        message: 'Please provide description, type, and location' 
      });
    }
    
    // Auto-generate title from type if not provided
    const reportTitle = title && title.trim() ? title.trim() : `${type} Reported`;

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
      title: reportTitle,
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

    // Create notifications for nearby users (within 2km)
    try {
      await createNotificationsForNearbyUsers(report, latitude, longitude);
    } catch (error) {
      // Don't fail report submission if notification creation fails
      console.error('Error creating notifications:', error);
    }

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

// DELETE /api/reports/:id - Delete a report (only if user owns it)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Require authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'Authentication required to delete reports' 
      });
    }

    const reportId = req.params.id;

    // Find the report
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ 
        message: 'Report not found' 
      });
    }

    // Check if user owns the report
    if (!report.userId || report.userId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'You can only delete your own reports' 
      });
    }

    // Delete the report
    await Report.findByIdAndDelete(reportId);

    return res.json({
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    return res.status(500).json({ 
      message: 'Server error deleting report', 
      error: error.message 
    });
  }
});

export default router;

