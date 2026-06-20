// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const multer = require('multer');

// // Cloudinary configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Multer storage for Cloudinary
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'event-images',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
//     public_id: (req, file) => {
//       // Remove spaces and special characters from filename
//       const fileName = file.originalname
//         .split('.')[0]
//         .replace(/\s+/g, '_')  // Replace spaces with underscores
//         .replace(/[^a-zA-Z0-9_-]/g, ''); // Remove special characters
//       return `${Date.now()}-${fileName}`;
//     },
//   },
// });

// const upload = multer({ 
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only images are allowed'), false);
//     }
//   }
// });

// module.exports = {
//   cloudinary,
//   upload,
// };

const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage for multer
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

module.exports = {
  cloudinary,
  upload,
};