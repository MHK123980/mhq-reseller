const Product = require('../models/Product');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.featured === 'true') filter.isFeatured = true;
    const products = await Product.find(filter).populate('category', 'name').sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.hasDiscount && body.discountedPrice && body.price) {
      const dp = parseFloat(body.discountedPrice);
      const p = parseFloat(body.price);
      body.discountPercent = dp < p ? parseFloat(((p - dp) / p * 100).toFixed(2)) : 0;
      if (body.discountPercent <= 0) { body.hasDiscount = false; body.discountPercent = 0; }
    } else {
      body.discountPercent = 0;
    }
    const product = await Product.create(body);
    const populatedProduct = await Product.findById(product._id).populate('category', 'name');
    
    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'product:new', populatedProduct);
    
    res.status(201).json({ success: true, product: populatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.hasDiscount && body.discountedPrice && body.price) {
      const dp = parseFloat(body.discountedPrice);
      const p = parseFloat(body.price);
      body.discountPercent = dp < p ? parseFloat(((p - dp) / p * 100).toFixed(2)) : 0;
      if (body.discountPercent <= 0) { body.hasDiscount = false; body.discountPercent = 0; }
    } else if (!body.hasDiscount) {
      body.discountPercent = 0;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, body, { new: true }).populate('category', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    
    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'product:updated', product);
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    
    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'product:deleted', { id: req.params.id });
    
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    
    product.isFeatured = !product.isFeatured;
    await product.save();
    await product.populate('category', 'name');
    
    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'product:updated', product);
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleOutOfStock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    
    product.isOutOfStock = !product.isOutOfStock;
    await product.save();
    await product.populate('category', 'name');
    
    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'product:updated', product);
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    
    await Product.deleteMany({ _id: { $in: ids } });
    
    const pusher = req.app.get('pusher');
    if (pusher) {
      // Trigger event for each deleted product so UI removes them
      for (const id of ids) {
        await pusher.trigger('mhq-reseller', 'product:deleted', { id });
      }
    }
    
    res.json({ success: true, message: 'Products deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, bulkDelete, toggleFeatured, toggleOutOfStock };
