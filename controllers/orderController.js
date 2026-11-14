const Order = require('../models/Order');
const OrderCounter = require('../models/OrderCounter');

// Generate order ID like MA101, MB102, MC103, etc.
async function generateOrderId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // If counter doesn't exist or is below 100, upsert with seq at 100 so first $inc gives 101
  let counter = await OrderCounter.findById('order_seq');
  if (!counter || typeof counter.seq !== 'number' || counter.seq < 100) {
    counter = await OrderCounter.findByIdAndUpdate(
      'order_seq',
      { $set: { seq: 101 } },
      { new: true, upsert: true }
    );
  } else {
    counter = await OrderCounter.findByIdAndUpdate(
      'order_seq',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
  }
  const seq = counter.seq; // e.g. 101, 102, 103...
  // Pick a letter based on offset: 101 -> A, 102 -> B, ..., wraps around
  const letterIndex = (seq - 101) % letters.length;
  const letter = letters[letterIndex] || 'A';
  return `M${letter}${seq}`;
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
    if (process.env.BREVO_API_KEY && (process.env.ADMIN_EMAIL || process.env.BREVO_SENDER_EMAIL)) {
      try {
        console.log('[Email] Attempting to send order email via Brevo for order:', order.orderId);
        await sendOrderEmail(populatedOrder);
        console.log('[Email] Brevo order notification sent successfully!');
      } catch (emailErr) {
        console.error('[Email Error] Failed to send Brevo notification:', emailErr && emailErr.response ? emailErr.response.body || emailErr.response.text : emailErr.message);
      }
    } else {
      console.warn('[Email Warning] BREVO_API_KEY or ADMIN_EMAIL is not set in environment variables.');
    }
    
    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'order:new', populatedOrder);
    
    res.status(201).json({ success: true, order: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function sendOrderEmail(order) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const recipientEmail = process.env.ADMIN_EMAIL || 'mhqreseller@gmail.com';
  // Brevo requires the sender email to be an active, verified sender or account email in Brevo dashboard
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.ADMIN_EMAIL || 'mhqreseller@gmail.com';

  const productsHtml = (order.products || []).map(p => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #27272a;color:#ffffff;font-size:13px;font-weight:600;">
        ${p.product ? p.product.name : 'Unknown Product'}
        ${p.selectedVariant ? `<div style="color:#fbbf24;font-size:11px;font-weight:normal;margin-top:2px;">Variant: ${p.selectedVariant}</div>` : ''}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #27272a;color:#fbbf24;text-align:center;font-weight:bold;font-size:13px;">${p.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #27272a;color:#ffffff;text-align:right;font-size:13px;">Rs ${(p.priceAtPurchase * p.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;">
    <div style="max-width:600px;margin:20px auto;background:#18181b;border:1px solid #d9770640;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
      
      <!-- Brand Header -->
      <div style="background:#000000;padding:26px 20px;text-align:center;border-bottom:2px solid #f59e0b;">
        <h1 style="color:#ffffff;font-size:26px;margin:0;font-family:Georgia,serif;letter-spacing:1px;">MHQ Reseller <span style="color:#fbbf24;font-size:16px;font-weight:normal;">(Broker)</span></h1>
        <p style="color:#a1a1aa;margin:5px 0 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;">New Customer Order Notification</p>
      </div>

      <div style="padding:24px;">
        <!-- Order Serial Banner -->
        <div style="background:#27272a;border:1px solid #fbbf2440;border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Order Serial ID</div>
            <div style="color:#fbbf24;font-size:24px;font-weight:900;font-family:monospace;letter-spacing:1.5px;margin-top:2px;">${order.orderId || ('#' + order._id.toString().slice(-6))}</div>
          </div>
          <div style="text-align:right;">
            <span style="background:#f59e0b;color:#000000;font-weight:bold;font-size:12px;padding:4px 10px;border-radius:20px;">PENDING COD</span>
          </div>
        </div>

        <!-- Customer Card -->
        <div style="background:#202023;border:1px solid #2e2e33;border-radius:12px;padding:18px;margin-bottom:20px;">
          <h3 style="color:#fbbf24;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;border-bottom:1px solid #2e2e33;padding-bottom:6px;">👤 Customer & Shipping Details</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:4px 0;color:#a1a1aa;width:35%;">Full Name:</td><td style="padding:4px 0;color:#ffffff;font-weight:bold;">${order.customerDetails.fullName}</td></tr>
            <tr><td style="padding:4px 0;color:#a1a1aa;">Phone Number:</td><td style="padding:4px 0;color:#fbbf24;font-weight:bold;"><a href="tel:${order.customerDetails.phoneNo}" style="color:#fbbf24;text-decoration:none;">${order.customerDetails.phoneNo}</a></td></tr>
            <tr><td style="padding:4px 0;color:#a1a1aa;">Address:</td><td style="padding:4px 0;color:#ffffff;">House #${order.customerDetails.houseNo}, ${order.customerDetails.streetNameNo}, ${order.customerDetails.areaName}</td></tr>
            <tr><td style="padding:4px 0;color:#a1a1aa;">City & Province:</td><td style="padding:4px 0;color:#ffffff;">${order.customerDetails.city}, ${order.customerDetails.province}</td></tr>
            ${order.customerDetails.famousPlace ? `<tr><td style="padding:4px 0;color:#a1a1aa;">Landmark / Near:</td><td style="padding:4px 0;color:#ffffff;">${order.customerDetails.famousPlace}</td></tr>` : ''}
            ${order.customerDetails.email ? `<tr><td style="padding:4px 0;color:#a1a1aa;">Email:</td><td style="padding:4px 0;color:#ffffff;">${order.customerDetails.email}</td></tr>` : ''}
          </table>
        </div>

        <!-- Items Table -->
        <div style="background:#202023;border:1px solid #2e2e33;border-radius:12px;padding:18px;margin-bottom:20px;">
          <h3 style="color:#fbbf24;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;border-bottom:1px solid #2e2e33;padding-bottom:6px;">🛍️ Order Items</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#141416;">
                <th style="padding:8px 12px;text-align:left;color:#a1a1aa;font-size:11px;text-transform:uppercase;">Product</th>
                <th style="padding:8px 12px;text-align:center;color:#a1a1aa;font-size:11px;text-transform:uppercase;">Qty</th>
                <th style="padding:8px 12px;text-align:right;color:#a1a1aa;font-size:11px;text-transform:uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>${productsHtml}</tbody>
          </table>

          <div style="border-top:2px solid #f59e0b40;margin-top:14px;padding-top:14px;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#a1a1aa;font-size:14px;">Total Payable Amount (COD):</span>
            <span style="color:#fbbf24;font-size:22px;font-weight:900;">Rs ${Number(order.totalAmount).toLocaleString()}</span>
          </div>
        </div>

        <p style="text-align:center;color:#52525b;font-size:11px;margin:18px 0 0 0;">
          MHQ Reseller (Broker) Automated Order Dispatch System<br>
          <span style="color:#71717a;font-weight:600;">Powered By MHT Devs</span>
        </p>
      </div>
    </div>
  </body>
  </html>`;

  const payload = JSON.stringify({
    sender: { name: 'MHQ Reseller Orders', email: senderEmail },
    to: [{ email: recipientEmail, name: 'Store Owner' }],
    subject: `🛍️ New Order ${order.orderId || '#' + order._id.toString().slice(-6)} — Rs ${order.totalAmount} — ${order.customerDetails.fullName}`,
    htmlContent
  });

  return new Promise((resolve, reject) => {
    const https = require('https');
    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('[Brevo Direct API] Email successfully accepted. Status:', res.statusCode, body);
          resolve(body);
        } else {
          console.error('[Brevo Direct API Error] Status:', res.statusCode, 'Body:', body);
          reject(new Error(`Brevo HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error('[Brevo Direct API Network Error]:', e.message);
      reject(e);
    });

    req.write(payload);
    req.end();
  });
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
