const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,  // require → required होना चाहिए
    unique: true
  },
   password: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model('Admin', adminSchema);
