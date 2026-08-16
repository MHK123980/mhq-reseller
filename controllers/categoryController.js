const Category = require('../models/Category');

const getAll = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    
    const category = await Category.create({ name, description });
    
    const pusher = req.app.get('pusher');
    if (pusher) pusher.trigger('mhq-reseller', 'category:new', category);
    
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    
    if (!category) return res.status(404).json({ success: false, message: 'Not found' });
    
    const pusher = req.app.get('pusher');
    if (pusher) pusher.trigger('mhq-reseller', 'category:updated', category);
    
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Not found' });
    
    const pusher = req.app.get('pusher');
    if (pusher) pusher.trigger('mhq-reseller', 'category:deleted', { id: req.params.id });
    
    res.json({ success: true, message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, update, remove };
