const Category = require('../models/Category');

// Get all categories
exports.getAll = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create category
exports.create = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: 'Category already exists' });

    const category = await Category.create({ name: name.trim(), description, image });

    // Emit socket event for real-time sync
    const io = req.app.get('io');
    if (io) io.emit('category:new', category);

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update category
exports.update = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, image },
      { new: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const io = req.app.get('io');
    if (io) io.emit('category:updated', category);

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete category
exports.remove = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const io = req.app.get('io');
    if (io) io.emit('category:deleted', req.params.id);

    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
