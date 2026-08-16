const Order = require('../models/Order');
const Product = require('../models/Product');

// Place order (public - no login required)
exports.placeOrder = async (req, res) => {
  try {
    const { customerDetails, products } = req.body;

    if (!customerDetails || !products || products.length === 0) {
      return res.status(400).json({ message: 'Customer details and products are required' });
    }

    // Calculate total
    let totalAmount = 0;
    const orderProducts = [];
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.productId}` });

      const price = product.isFeatured && product.hasDiscount
        ? product.price - (product.price * (product.discountPercent / 100))
        : product.price;

      orderProducts.push({
        product: product._id,
        quantity: item.quantity || 1,
        priceAtPurchase: price
      });
      totalAmount += price * (item.quantity || 1);
    }

    const order = await Order.create({
      customerDetails,
      products: orderProducts,
      totalAmount,
      status: 'Pending'
    });

    const populated = await order.populate('products.product', 'name images price');

    // Emit to admin in real-time
    const io = req.app.get('io');
    if (io) io.emit('order:new', populated);

    res.status(201).json({ message: 'Order placed successfully', order: populated });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders (admin)
exports.getAll = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('products.product', 'name images price')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single order (admin)
exports.getOne = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product', 'name images price');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status (admin)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('products.product', 'name images price');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    if (io) io.emit('order:updated', order);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete order (admin)
exports.remove = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    if (io) io.emit('order:deleted', req.params.id);

    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Dashboard stats (admin)
exports.getStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
