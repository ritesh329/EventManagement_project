const mongoose = require('mongoose');

let isConnected=false;
const connectDB = async () => {


    if(isConnected)
     {
        console.log('📦 MongoDB already connected (singleton)');
        return;
     }


  try {

    await mongoose.connect(process.env.MONGO_URI);
    isConnected=true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
       throw new Error('MongoDB connection error');

  }
};

module.exports = connectDB;
