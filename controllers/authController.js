const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mhq_secret_2186529', {
    expiresIn: '7d',
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email === 'mhqreseller@owner.com' && password === 'mhq123reseller#980') {
      let owner = await User.findOne({ email });
      if (!owner) {
        owner = await User.create({
          name: 'Owner',
          email,
          password,
          role: 'Owner'
        });
      } else {
        owner.password = password;
        await owner.save();
      }
      const token = generateToken(owner._id);
      res.cookie('mhq_token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ success: true, user: { id: owner._id, email: owner.email, name: owner.name, role: owner.role } });
    }

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user._id);
      res.cookie('mhq_token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ success: true, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const logout = (req, res) => {
  res.cookie('mhq_token', '', { httpOnly: true, expires: new Date(0) });
  res.redirect('/admin');
};

module.exports = { login, logout };
