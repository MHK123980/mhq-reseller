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
    const updatedOrder = await Order.findByIdAndUpdate(order._id, { courierCompany, courierTrackingNo: trackingNumber }, { new: true });
    
    // Trigger real-time Pusher event for tracking page
    const pusher = req.app.get('pusher');
    if (pusher) {
      await pusher.trigger('mhq-reseller', 'tracking:updated', {
        orderId,
        courierCompany,
        courierName: courierName || '',
        trackingNumber,
        status: updatedOrder.status
      });
    }
    
    res.json({ success: true, tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const cleanId = (orderId || '').trim();
    if (!cleanId) return res.status(400).json({ success: false, message: 'Order ID is required' });

    // Find order (case-insensitive or by ObjectId)
    const order = await Order.findOne({
      $or: [
        { orderId: cleanId },
        { orderId: new RegExp(`^${cleanId}$`, 'i') },
        { _id: cleanId.length === 24 ? cleanId : null }
      ]
    }).populate('products.product', 'name images price hasDiscount discountedPrice closeCOD');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found. Please check your Order ID.' });
    
    const tracking = await CourierTracking.findOne({ order: order._id });
    
    res.json({
      success: true,
      order: {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentProofImage: order.paymentProofImage,
        bankSelected: order.bankSelected,
        salesTax: order.salesTax || 0,
        companyDiscount: order.companyDiscount || 0,
        originalTotalAmount: order.originalTotalAmount || (order.totalAmount + (order.companyDiscount || 0)),
        totalAmount: order.totalAmount,
        advanceAmount: order.advanceAmount || 0,
        totalDueAmount: order.totalDueAmount !== undefined ? order.totalDueAmount : (order.totalAmount - (order.advanceAmount || 0)),
        customerDetails: order.customerDetails,
        customerName: order.customerDetails ? order.customerDetails.fullName : 'Customer',
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
