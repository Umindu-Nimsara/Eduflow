const mongoose = require('mongoose');

const instructorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  expertise: [{
    type: String,
    trim: true
  }],
  specialization: {
    type: String,
    trim: true,
    maxlength: [200, 'Specialization cannot exceed 200 characters']
  },
  qualifications: {
    type: String,
    trim: true,
    maxlength: [500, 'Qualifications cannot exceed 500 characters']
  },
  experience: {
    type: String,
    trim: true,
    maxlength: [500, 'Experience cannot exceed 500 characters']
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  totalCourses: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  socialLinks: {
    linkedin: {
      type: String,
      trim: true
    },
    youtube: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InstructorProfile', instructorProfileSchema);
