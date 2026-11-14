const CourierTracking = require('../models/CourierTracking');
const Order = require('../models/Order');

const getAll = async (req, res) => {
  try {
    const trackings = await CourierTracking.find().populate('order', 'orderId customerDetails.fullName totalAmount status').sort({ createdAt: -1 });
    res.json({ success: true, trackings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const save = async (req, res) => {
  try {
    const { orderId, courierCompany, courierName, trackingNumber } = req.body;
    if (!orderId || !courierCompany || !trackingNumber) {
      return res.status(400).json({ success: false, message: 'orderId, courierCompany, and trackingNumber are required' });
    }
    
    // Find order
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Upsert
    const tracking = await CourierTracking.findOneAndUpdate(
      { order: order._id },
      { order: order._id, orderId, courierCompany, courierName: courierName || '', trackingNumber },
      { new: true, upsert: true }
    );
    
    // Also save on the order itself for easy lookup
    await Order.findByIdAndUpdate(order._id, { courierCompany, courierTrackingNo: trackingNumber });
    
    res.json({ success: true, tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    // Find order first
    const order = await Order.findOne({ orderId }).populate('products.product', 'name images price');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found. Please check your Order ID.' });
    
    const tracking = await CourierTracking.findOne({ order: order._id });
    
    res.json({
      success: true,
      order: {
        orderId: order.orderId,
        status: order.status,
        totalAmount: order.totalAmount,
        customerName: order.customerDetails.fullName,
        products: order.products,
        createdAt: order.createdAt,
      },
      tracking: tracking ? {
        courierCompany: tracking.courierCompany,
        courierName: tracking.courierName,
        trackingNumber: tracking.trackingNumber,
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await CourierTracking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, save, getByOrderId, remove };
