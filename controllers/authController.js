const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bucket = require('../config/firebase');
const Admin = require('../models/admin');



exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const profileImage = req.file; 

    // Validation
    if (!name || !email || !password || !profileImage) {
      return res.status(400).render('fail',{ message: 'All fields are required' });
    }

     const userexist=await user.findOne({email});

     if(!userexist){
            return res.status(400).render('fail',{ message: 'User Already Exists please enter diffrent email' });
     } 
   
    const fileName = `profiles/${Date.now()}-${profileImage.originalname}`;
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: { contentType: profileImage.mimetype }
    });

    // Error event handle
    blobStream.on('error', (err) => {
      console.error('Upload error:', err);
      return res.status(500).render('fail',{ message: 'File upload failed' });
    });

   
    blobStream.on('finish', async () => {
      try {
         // Make the file public (IMPORTANT)
        await blob.makePublic();
        // Firebase public URL
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        // Password hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // New user create
        const user = new User({
          name,
          email,
          password: hashedPassword,
          profileImage: imageUrl 
        });

        await user.save();

        // Signup success
        return res.status(201).render('login');
      } catch (dbErr) {
        console.error('Database save error:', dbErr);
        return res.status(500).render('fail',{ message: 'Server error while saving user' });
      }
    });

   
    blobStream.end(profileImage.buffer);

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

//  Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password , isAdmin} = req.body;

    //  Check required fields
    if (!email || !password) {
      return res.status(400).render('fail',{ message: 'Email and password are required' });
    }
   

     if (isAdmin) {
      // ===== Admin Login Logic =====
      const admin = await Admin.findOne({email});
      if (!admin) {
        return res.status(401).render('fail',{message: "Admin not found"});
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).render('fail',{message:"Invalid admin credentials"});
      }

       const token = jwt.sign(
        { id: admin._id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } 
      );

       res.cookie('token', token, { httpOnly: true });
    
      return res.status(200).redirect('/admin/dashboard');
    } else {

    //  Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).render('fail',{ message: 'User not found' });

    //  Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).render('fail',{ message: 'Invalid password' });

    //  Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    //Store token in HttpOnly cookie (secure for EJS based apps)
    res.cookie('token', token, {
      httpOnly: true,      // not accessible by JS
      secure: false,       // true if using https
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

  
    res.redirect('/api/getAllEvents');
  }
  } catch (err) {
    console.error(err);
    res.status(500).render('fail',{ message: 'Server error' });
  }
};


exports.getlogin=(req,res)=>{

     res.render('login');
}
exports.getSignUp=(req,res)=>{
     res.render('signup');
}
exports.checkLogin=(req,res)=>{

       if(!req.user)
       {
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
      return res.status(404).render('fail',{ message: 'User not found' });
    }

   
    res.status(200).redirect('/reset-password');
  } catch (err) {
    console.error(err);
    res.status(500).render('fail',{ message: 'Server error' });
  }
};

exports.directResetPassword = async (req, res) => {
  try {
    const  email = (req.body.email).trim();
     const  password = (req.body.password).trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).render('fail',{ message: 'User not found' });

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.status(200).redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).render('fail',{ message: 'Server error' });
  }
};

exports.getForgotPassword=(req,res)=>{

     res.render('forget-password');

}

exports.getResetPassword=(req,res)=>{

     res.render('reset-password');
}
