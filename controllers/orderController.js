const Order = require('../models/Order');
const OrderCounter = require('../models/OrderCounter');

// Generate order ID like EA101, EB102, etc.
async function generateOrderId() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const counter = await OrderCounter.findByIdAndUpdate(
    'order_seq',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seq = counter.seq;
  const letterIndex = Math.floor((seq - 101) / 900) % letters.length;
  const letter = letters[letterIndex] || letters[0];
  return `E${letter}${seq}`;
}

const getAll = async (req, res) => {
  try {
    const orders = await Order.find().populate('products.product', 'name images price').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id.length === 24 ? req.params.id : null }, { orderId: req.params.id }]
    }).populate('products.product', 'name images price');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
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
      if (!p.isFreeDelivery && p.deliveryCharges > 0) {
        totalAmount += p.deliveryCharges;
      }
      return {
        product: p.product,
        quantity: p.quantity,
        priceAtPurchase: p.priceAtPurchase,
        selectedVariant: p.selectedVariant || '',
        deliveryCharges: p.deliveryCharges || 0,
        isFreeDelivery: p.isFreeDelivery || false
      };
    });
    
    const orderId = await generateOrderId();
    
    const order = await Order.create({
      orderId,
      customerDetails,
      products: formattedProducts,
      totalAmount
    });
    
    const populatedOrder = await Order.findById(order._id).populate('products.product', 'name images price');
    
    // Send Brevo email notification
    if (process.env.BREVO_API_KEY && process.env.ADMIN_EMAIL) {
      try {
        await sendOrderEmail(populatedOrder);
      } catch (emailErr) {
        console.error('Email error:', emailErr.message);
      }
    }
    
    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'order:new', populatedOrder);
    
    res.status(201).json({ success: true, order: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function sendOrderEmail(order) {
  const SibApiV3Sdk = require('@getbrevo/brevo');
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

  const productsHtml = order.products.map(p => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#e5e5e5;">${p.product ? p.product.name : 'Unknown'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#fbbf24;text-align:center;">${p.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#fbbf24;text-align:right;">Rs ${p.priceAtPurchase * p.quantity}</td>
      ${p.selectedVariant ? `<td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#a1a1a1;">${p.selectedVariant}</td>` : '<td></td>'}
    </tr>
  `).join('');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:30px 20px;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#fbbf24;font-size:28px;margin:0;font-family:Georgia,serif;">MHQ Reseller</h1>
        <p style="color:#71717a;margin:4px 0 0 0;font-size:13px;">(Broker)</p>
      </div>
      
      <div style="background:#111;border:1px solid #fbbf2430;border-radius:16px;padding:24px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #222;">
          <div>
            <p style="color:#71717a;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:1px;">New Order Received</p>
            <p style="color:#fbbf24;font-size:20px;font-weight:700;margin:0;font-family:monospace;">${order.orderId || order._id.toString().slice(-6)}</p>
          </div>
          <div style="background:#fbbf2420;border:1px solid #fbbf2440;border-radius:8px;padding:6px 14px;">
            <p style="color:#fbbf24;font-weight:700;margin:0;font-size:13px;">Pending</p>
          </div>
        </div>
        
        <h3 style="color:#fbbf24;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Customer Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#71717a;font-size:13px;width:40%;">Name</td><td style="padding:4px 0;color:#e5e5e5;font-size:13px;font-weight:600;">${order.customerDetails.fullName}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;font-size:13px;">Phone</td><td style="padding:4px 0;color:#e5e5e5;font-size:13px;">${order.customerDetails.phoneNo}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;font-size:13px;">Address</td><td style="padding:4px 0;color:#e5e5e5;font-size:13px;">${order.customerDetails.houseNo}, ${order.customerDetails.streetNameNo}, ${order.customerDetails.areaName}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;font-size:13px;">City</td><td style="padding:4px 0;color:#e5e5e5;font-size:13px;">${order.customerDetails.city}, ${order.customerDetails.province}</td></tr>
          ${order.customerDetails.email ? `<tr><td style="padding:4px 0;color:#71717a;font-size:13px;">Email</td><td style="padding:4px 0;color:#e5e5e5;font-size:13px;">${order.customerDetails.email}</td></tr>` : ''}
          ${order.customerDetails.famousPlace ? `<tr><td style="padding:4px 0;color:#71717a;font-size:13px;">Landmark</td><td style="padding:4px 0;color:#e5e5e5;font-size:13px;">${order.customerDetails.famousPlace}</td></tr>` : ''}
        </table>
      </div>
      
      <div style="background:#111;border:1px solid #fbbf2430;border-radius:16px;padding:24px;margin-bottom:20px;">
        <h3 style="color:#fbbf24;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px 0;">Order Items</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1a1a1a;">
              <th style="padding:8px 12px;text-align:left;color:#71717a;font-size:12px;font-weight:600;">Product</th>
              <th style="padding:8px 12px;text-align:center;color:#71717a;font-size:12px;font-weight:600;">Qty</th>
              <th style="padding:8px 12px;text-align:right;color:#71717a;font-size:12px;font-weight:600;">Price</th>
              <th style="padding:8px 12px;text-align:left;color:#71717a;font-size:12px;font-weight:600;">Variant</th>
            </tr>
          </thead>
          <tbody>${productsHtml}</tbody>
        </table>
        <div style="border-top:2px solid #fbbf2430;margin-top:12px;padding-top:12px;text-align:right;">
          <span style="color:#71717a;font-size:14px;">Total Amount: </span>
          <span style="color:#fbbf24;font-size:20px;font-weight:800;">Rs ${order.totalAmount}</span>
        </div>
      </div>
      
      <p style="text-align:center;color:#3f3f46;font-size:12px;margin-top:20px;">MHQ Reseller Admin Panel • This is an automated notification</p>
    </div>
  </body>
  </html>`;

  const sendSmtpEmail = {
    to: [{ email: process.env.ADMIN_EMAIL }],
    sender: { email: process.env.BREVO_SENDER_EMAIL || process.env.ADMIN_EMAIL, name: 'MHQ Reseller' },
    subject: `🛍️ New Order ${order.orderId || '#' + order._id.toString().slice(-6)} — Rs ${order.totalAmount} — ${order.customerDetails.fullName}`,
    htmlContent,
  };

  await apiInstance.sendTransacEmail(sendSmtpEmail);
}

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

const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    await Order.deleteMany({ _id: { $in: ids } });
    const pusher = req.app.get('pusher');
    if (pusher) {
      for (const id of ids) {
        await pusher.trigger('mhq-reseller', 'order:deleted', { id });
      }
    }
    res.json({ success: true, message: 'Orders deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, updateStatus, remove, bulkDelete, getStats };
