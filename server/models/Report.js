import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
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
  location: {
    type: String,
    required: true,
    trim: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous reports
  },
  username: {
    type: String,
    required: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

export default mongoose.model('Report', reportSchema);

