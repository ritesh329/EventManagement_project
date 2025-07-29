const jwt = require('jsonwebtoken');
const User = require('../models/User');  


exports.verifyToken = async (req, res, next) => {
  try {
    let token;

    
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
 
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

  
    if (!token) {
      return res.status(401).render('login', { error: 'Unauthorized access' });
    }

  
    const decoded = jwt.verify(token, process.env.JWT_SECRET );

  
    const user = await User.findById(decoded.userId);
    if (!user || user.isBlocked) {
      
      res.clearCookie('token');
      return res.status(403).render('blocked', { message: 'Your account is blocked' });
    }

    
    req.user = decoded;  

    next();
  } catch (err) {
    console.error('JWT Error:', err.message);
    return res.status(401).render('login', { error: 'Invalid or expired token' });
  }
};

exports.verifyAdmin = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).redirect('/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).send("Forbidden! Not a Admin .");
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).send("Invalid or expired token");
  }
};
