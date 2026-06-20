// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// const bucket = require('../config/firebase');
// const Admin = require('../models/admin');



// exports.signup = async (req, res) => {
//   const { name, email, password } = req.body;
//   const profileImage = req.file;

//   // Basic validation
//   if (!name || !email || !password || !profileImage) {
//     return res.status(400).render('fail', { message: 'All fields are required' });
//   }

//   try {
//     // Check for existing user
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).render('fail', {
//         message: 'User Already Exists, please enter a different email',
//       });
//     }

//     // Prepare file upload to Firebase
//     const fileName = `profiles/${Date.now()}-${profileImage.originalname}`;
//     const blob = bucket.file(fileName);
//     const blobStream = blob.createWriteStream({
//       metadata: { contentType: profileImage.mimetype },
//     });

//     blobStream.on('error', (err) => {
//       console.error('Upload error:', err);
//       return res.status(500).render('fail', { message: 'File upload failed' });
//     });

//     blobStream.on('finish', async () => {
//       try {
//         await blob.makePublic();
//         const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const newUser = new User({
//           name,
//           email,
//           password: hashedPassword,
//           profileImage: imageUrl,
//         });

//         await newUser.save();
//         return res.status(201).render('login');
//       } catch (saveErr) {
//         console.error('Database save error:', saveErr);
//         return res.status(500).render('fail', {
//           message: 'Server error while saving user',
//         });
//       }
//     });

//     // Start uploading
//     blobStream.end(profileImage.buffer);
//   } catch (err) {
//     console.error('Signup error:', err);
//     return res.status(500).render('fail', { message: 'Server error' });
//   }
// };

// //  Login Controller
// exports.login = async (req, res) => {
//   try {
//     const { email, password , isAdmin} = req.body;

//     //  Check required fields
//     if (!email || !password) {
//       return res.status(400).render('fail',{ message: 'Email and password are required' });
//     }
   

//      if (isAdmin) {
//       // ===== Admin Login Logic =====
//       const admin = await Admin.findOne({email});
//       if (!admin) {
//         return res.status(401).render('fail',{message: "Admin not found"});
//       }

//       const isMatch = await bcrypt.compare(password, admin.password);
//       if (!isMatch) {
//         return res.status(401).render('fail',{message:"Invalid admin credentials"});
//       }

//        const token = jwt.sign(
//         { id: admin._id, role: "admin" },
//         process.env.JWT_SECRET,
//         { expiresIn: '1h' } 
//       );

//        res.cookie('token', token, { httpOnly: true });
    
//       return res.status(200).redirect('/admin/dashboard');
//     } else {

//     //  Find user
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).render('fail',{ message: 'User not found' });

//     //  Password check
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).render('fail',{ message: 'Invalid password' });

//     //  Create JWT token
//     const token = jwt.sign(
//       { userId: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '1d' }
//     );

//     //Store token in HttpOnly cookie (secure for EJS based apps)
//     res.cookie('token', token, {
//       httpOnly: true,      // not accessible by JS
//       secure: false,       // true if using https
//       maxAge: 24 * 60 * 60 * 1000 // 1 day
//     });

  
//     res.redirect('/api/getAllEvents');
//   }
//   } catch (err) {
//     console.error(err);
//     res.status(500).render('fail',{ message: 'Server error' });
//   }
// };


// exports.getlogin=(req,res)=>{

//      res.render('login');
// }
// exports.getSignUp=(req,res)=>{
//      res.render('signup');
// }
// exports.checkLogin=(req,res)=>{

//        if(!req.user)
//        {
//             return res.redirect('/login');
//        }

//         res.redirect('/api/getAllEvents');
// };

// exports.logout = (req, res) => {
//   res.clearCookie('token');
//   res.status(200).redirect('/login');
// };

// exports.verifyUserForReset = async (req, res) => {
//   try {
//     const email = (req.body.email).trim();  

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).render('fail',{ message: 'User not found' });
//     }

   
//     res.status(200).redirect('/reset-password');
//   } catch (err) {
//     console.error(err);
//     res.status(500).render('fail',{ message: 'Server error' });
//   }
// };

// exports.directResetPassword = async (req, res) => {
//   try {
//     const email = req.body.email?.trim();
//     const password = req.body.newPassword?.trim();

//     // Validate input
//     if (!email || !password) {
//       return res.status(400).render('fail', { message: 'Email and password are required' });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).render('fail', { message: 'User not found' });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     user.password = hashedPassword;

//     await user.save();

//     return res.status(200).redirect('/login');
//   } catch (err) {
//     console.error('Reset password error:', err);
//     return res.status(500).render('fail', { message: 'Server error while resetting password' });
//   }
// };

// exports.getForgotPassword=(req,res)=>{

//      res.render('forget-password');

// }

// exports.getResetPassword=(req,res)=>{

//      res.render('reset-password');
// }


const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const { cloudinary } = require('../config/cloudinary'); // ✅ Cloudinary import

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  const profileImage = req.file;

  // Basic validation
  if (!name || !email || !password || !profileImage) {
    return res.status(400).render('fail', { message: 'All fields are required' });
  }

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('fail', {
        message: 'User Already Exists, please enter a different email',
      });
    }

    // === Upload to Cloudinary ===
    let imageUrl = null;
    try {
      // Convert buffer to base64
      const b64 = profileImage.buffer.toString('base64');
      let dataURI = `data:${profileImage.mimetype};base64,${b64}`;
      
      // ✅ CRITICAL: Clean filename - remove ALL spaces and special characters
      let cleanFileName = profileImage.originalname
        .split('.')[0]  // Remove extension
        .trim()          // Remove leading/trailing spaces
        .replace(/\s+/g, '_')  // Replace spaces with underscore
        .replace(/[^a-zA-Z0-9_]/g, ''); // Remove all special characters
      
      // ✅ Ensure filename is not empty
      if (!cleanFileName || cleanFileName.length === 0) {
        cleanFileName = 'profile';
      }
      
      // ✅ Create public_id - just use timestamp if filename has issues
      const publicId = `profile_${Date.now()}`;
      
      console.log('Uploading with public_id:', publicId);
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'profiles',
        resource_type: 'image',
        public_id: publicId  // Use only timestamp to avoid any filename issues
      });
      
      imageUrl = result.secure_url;
      console.log('Profile image uploaded to Cloudinary:', result.public_id);
      console.log('Image URL:', imageUrl);
      
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr);
      return res.status(500).render('fail', { 
        message: 'File upload failed: ' + uploadErr.message 
      });
    }

    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      profileImage: imageUrl,
    });

    await newUser.save();
    return res.status(201).render('login');

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).render('fail', { message: 'Server error' });
  }
};
// Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password, isAdmin } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).render('fail', { message: 'Email and password are required' });
    }

    if (isAdmin) {
      // ===== Admin Login Logic =====
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).render('fail', { message: "Admin not found" });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).render('fail', { message: "Invalid admin credentials" });
      }

      const token = jwt.sign(
        { id: admin._id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.cookie('token', token, { httpOnly: true });
      return res.status(200).redirect('/admin/dashboard');
    } else {
      // ===== User Login Logic =====
      const user = await User.findOne({ email });
      if (!user) return res.status(404).render('fail', { message: 'User not found' });

      // Password check
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).render('fail', { message: 'Invalid password' });

      // Create JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Store token in HttpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // true if using https
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      res.redirect('/api/getAllEvents');
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('fail', { message: 'Server error' });
  }
};

exports.getlogin = (req, res) => {
  res.render('login');
};

exports.getSignUp = (req, res) => {
  res.render('signup');
};

exports.checkLogin = (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  res.redirect('/api/getAllEvents');
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).redirect('/login');
};

exports.verifyUserForReset = async (req, res) => {
  try {
    const email = (req.body.email).trim();
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).render('fail', { message: 'User not found' });
    }
    res.status(200).redirect('/reset-password');
  } catch (err) {
    console.error(err);
    res.status(500).render('fail', { message: 'Server error' });
  }
};

exports.directResetPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.newPassword?.trim();

    // Validate input
    if (!email || !password) {
      return res.status(400).render('fail', { message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).render('fail', { message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).redirect('/login');
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).render('fail', { message: 'Server error while resetting password' });
  }
};

exports.getForgotPassword = (req, res) => {
  res.render('forget-password');
};

exports.getResetPassword = (req, res) => {
  res.render('reset-password');
};