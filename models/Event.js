const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,

  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: true,
    max: 1000,
    min: 1
  },
  image: {
    type: String, 
    default: "",
    trim: true,   
  },
  description:{
      type:String,
       default: "" ,
       trim: true,
  }
});

module.exports = mongoose.model('Event', eventSchema);
