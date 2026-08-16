const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_mhq';

const OWNER_EMAIL = 'mhqreseller@owner.com';
const OWNER_PASSWORD = 'mhq123reseller#980';

// Seed owner on startup
async function seedOwner() {
  try {
    const existing = await User.findOne({ email: OWNER_EMAIL });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);
      await User.create({
        email: OWNER_EMAIL,
        password: hashedPassword,
        role: 'Owner',
        name: 'MHQ Owner'
      });
      console.log('✅ Owner account seeded successfully');
    } else {
      console.log('ℹ️  Owner account already exists');
    }
  } catch (err) {
    console.error('❌ Error seeding owner:', err);
  }
}

seedOwner();

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Direct check for Owner credentials: auto-create/sync if necessary
    if (cleanEmail === OWNER_EMAIL && password === OWNER_PASSWORD) {
      let owner = await User.findOne({ email: OWNER_EMAIL });
      const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);

      if (!owner) {
        owner = await User.create({
          email: OWNER_EMAIL,
          password: hashedPassword,
          role: 'Owner',
          name: 'MHQ Owner'
        });
      } else {
        // Ensure password matches in DB
        owner.password = hashedPassword;
        await owner.save();
      }

      const token = jwt.sign(
        { id: owner._id, role: owner.role, name: owner.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: owner._id,
          email: owner.email,
          name: owner.name,
          role: owner.role
        }
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new staff user (admin, manager)
exports.createUser = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name,
      role: role || 'Manager'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const update = { name, email, role };

    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'Owner') return res.status(403).json({ message: 'Cannot delete owner account' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
