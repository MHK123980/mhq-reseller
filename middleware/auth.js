const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = req.cookies.mhq_token;
  if (!token) {
    return res.redirect('/admin');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mhq_secret_2186529');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.redirect('/admin');
    }
    next();
  } catch (error) {
    res.redirect('/admin');
  }
};

const protectAPI = async (req, res, next) => {
  let token = req.cookies.mhq_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mhq_secret_2186529');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protect, protectAPI };
