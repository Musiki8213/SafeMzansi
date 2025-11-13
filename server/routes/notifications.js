import express from 'express';
import jwt from 'jsonwebtoken';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

// Helper function to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
  next();
};

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

// GET /api/notifications - Get all notifications for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // Newest first
      .limit(100) // Limit to prevent huge responses
      .lean();

    // Format response
    return res.json({
      notifications: notifications.map(notification => ({
        id: notification._id.toString(),
        reportId: notification.reportId.toString(),
        type: notification.type,
        message: notification.message,
        location: notification.location,
        lat: notification.lat,
        lng: notification.lng,
        distance: notification.distance,
        read: notification.read,
        createdAt: notification.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ 
      message: 'Server error fetching notifications', 
      error: error.message 
    });
  }
});

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    const count = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });

    return res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ 
      message: 'Server error fetching unread count', 
      error: error.message 
    });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ 
        message: 'Notification not found' 
      });
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'You can only mark your own notifications as read' 
      });
    }

    notification.read = true;
    await notification.save();

    return res.json({
      message: 'Notification marked as read',
      notification: {
        id: notification._id.toString(),
        read: notification.read
      }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    return res.status(500).json({ 
      message: 'Server error marking notification as read', 
      error: error.message 
    });
  }
});

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch('/mark-all-read', verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    return res.json({
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ 
      message: 'Server error marking all notifications as read', 
      error: error.message 
    });
  }
});

export default router;

