const Product = require('../models/Product');

// Get all products (public)
exports.getAll = async (req, res) => {
  try {
    const { category, featured } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;

    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single product (public)
exports.getOne = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create product (admin)
exports.create = async (req, res) => {
  try {
    const {
      name, price, description, category,
      hasDiscount, discountPercent, deliveryCharges,
      isFreeDelivery, isFeatured, isLowInStock, isOutOfStock, images
    } = req.body;

    if (!name || !price || !description || !category || !images || images.length === 0) {
      return res.status(400).json({ message: 'Name, price, description, category, and at least one image are required' });
    }

    const product = await Product.create({
      name, price, description, category,
      hasDiscount: hasDiscount || false,
      discountPercent: discountPercent || 0,
      deliveryCharges: deliveryCharges || 0,
      isFreeDelivery: isFreeDelivery || false,
      isFeatured: isFeatured || false,
      isLowInStock: isLowInStock || false,
      isOutOfStock: isOutOfStock || false,
      images
    });

    const populated = await product.populate('category', 'name');

    const io = req.app.get('io');
    if (io) io.emit('product:new', populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product (admin)
exports.update = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const io = req.app.get('io');
    if (io) io.emit('product:updated', product);

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete product (admin)
exports.remove = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const io = req.app.get('io');
    if (io) io.emit('product:deleted', req.params.id);

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle featured
exports.toggleFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.isFeatured = !product.isFeatured;
    await product.save();
    await product.populate('category', 'name');

    const io = req.app.get('io');
    if (io) io.emit('product:updated', product);

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle out of stock
exports.toggleOutOfStock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.isOutOfStock = !product.isOutOfStock;
    await product.save();
    await product.populate('category', 'name');

    const io = req.app.get('io');
    if (io) io.emit('product:updated', product);

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
