const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    max: 1000,
    min: 1
  },
  image: {
    type: String, 
    default: ""   
  },
  description:{
      type:String,
       default: "" 
  }
});

module.exports = mongoose.model('Event', eventSchema);
