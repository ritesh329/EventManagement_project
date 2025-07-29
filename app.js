const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const cookieParser = require('cookie-parser');

dotenv.config();
const app = express();

connectDB();

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// View engine
app.set('view engine', 'ejs');

// Routes
app.use('/api', require('./routes/eventRoutes'));
app.use('/', require('./routes/userRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
