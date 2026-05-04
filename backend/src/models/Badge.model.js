const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  icon: {
    type: String,
    required: [true, 'Icon URL is required']
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    maxlength: [200, 'Condition cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Badge', badgeSchema);
