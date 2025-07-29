const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,  // require → required होना चाहिए
    unique: true,
    trim: true, // Trim whitespace
  },
   password: {
    type: String,
    required: true,
    trim: true,
  }
});

module.exports = mongoose.model('Admin', adminSchema);
