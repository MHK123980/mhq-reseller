const Order = require('../models/Order');

const getAll = async (req, res) => {
  try {
    const orders = await Order.find().populate('products.product', 'name images price').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { customerDetails, products } = req.body;
    let totalAmount = 0;
    
    const formattedProducts = products.map(p => {
      totalAmount += p.priceAtPurchase * p.quantity;
      return {
        product: p.product,
        quantity: p.quantity,
        priceAtPurchase: p.priceAtPurchase
      };
    });
    
    const order = await Order.create({
      customerDetails,
      products: formattedProducts,
      totalAmount
    });
    
    const populatedOrder = await Order.findById(order._id).populate('products.product', 'name images price');
    
    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'order:new', populatedOrder);
    
    res.status(201).json({ success: true, order: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('products.product', 'name images price');
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    
    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'order:updated', order);
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    
    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'order:deleted', { id: req.params.id });
    
    res.json({ success: true, message: 'Order removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const deliveredOrdersList = await Order.find({ status: 'Delivered' });
    
    const deliveredOrders = deliveredOrdersList.length;
    const totalRevenue = deliveredOrdersList.reduce((sum, order) => sum + order.totalAmount, 0);
    
    res.json({ success: true, stats: { totalOrders, pendingOrders, deliveredOrders, totalRevenue } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, updateStatus, remove, getStats };
