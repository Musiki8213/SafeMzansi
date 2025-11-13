import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // For faster queries
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Theft',
      'Hijacking',
      'Assault',
      'Burglary',
      'Robbery',
      'Vandalism',
      'Drug Activity',
      'Suspicious Activity',
      'Domestic Violence',
      'Other'
    ]
  },
  message: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  distance: {
    type: Number, // Distance in meters
    required: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);

