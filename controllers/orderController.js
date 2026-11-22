const Order = require('../models/Order');
const OrderCounter = require('../models/OrderCounter');

// Generate order ID like MA101, MB102, MC103, ..., wrapping back to MA after MZ cleanly
async function generateOrderId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
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
  const seq = counter.seq; // 101, 102, ...
  const letterIndex = (seq - 101) % letters.length;
  const letter = letters[letterIndex] || 'A';
  return `M${letter}${seq}`;
}

// Calculate required advance amount based on cart subtotal for "Pay Some Advance"
function calculateAdvanceRequired(subtotal) {
  if (subtotal < 200) return 100;
  if (subtotal < 500) return 200;
  if (subtotal < 1500) return 400;
  if (subtotal < 3000) return 700;
  return 850;
}

const getAll = async (req, res) => {
  try {
    const { status, paymentStatus, paymentPendingOnly } = req.query;
    let query = {};
    if (paymentPendingOnly === 'true') {
      query.paymentStatus = 'Under Review';
    } else {
      if (status) query.status = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;
    }
    const orders = await Order.find(query).populate('products.product', 'name images price hasDiscount discountedPrice closeCOD').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id.length === 24 ? req.params.id : null }, { orderId: req.params.id }]
    }).populate('products.product', 'name images price hasDiscount discountedPrice closeCOD');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const {
      customerDetails,
      products,
      paymentMethod = 'COD',
      paymentProofImage = '',
      bankSelected = '',
      companyDiscount = 0,
      isAdminCreated = false,
      status: requestedStatus
    } = req.body;

    const isAdmin = Boolean(isAdminCreated);

    let finalCustDetails = customerDetails || {};
    if (isAdmin) {
      finalCustDetails = {
        fullName: (finalCustDetails.fullName && finalCustDetails.fullName.trim()) || 'Walk-in Customer',
        phoneNo: (finalCustDetails.phoneNo && finalCustDetails.phoneNo.trim()) || 'N/A',
        houseNo: (finalCustDetails.houseNo && finalCustDetails.houseNo.trim()) || '',
        streetNameNo: (finalCustDetails.streetNameNo && finalCustDetails.streetNameNo.trim()) || '',
        areaName: (finalCustDetails.areaName && finalCustDetails.areaName.trim()) || 'Admin Order',
        city: (finalCustDetails.city && finalCustDetails.city.trim()) || 'Store Counter',
        province: (finalCustDetails.province && finalCustDetails.province.trim()) || 'Sindh',
        famousPlace: (finalCustDetails.famousPlace && finalCustDetails.famousPlace.trim()) || '',
        email: (finalCustDetails.email && finalCustDetails.email.trim()) || ''
      };
    } else {
      if (!customerDetails || !customerDetails.fullName || !customerDetails.phoneNo) {
        return res.status(400).json({ success: false, message: 'Customer details (Full Name & Phone Number) are required' });
      }
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Products are required' });
    }

    let itemsSubtotal = 0;
    let totalDelivery = 0;

    const formattedProducts = products.map(p => {
      const prodId = p.product || p.productId;
      const unitPrice = Number(p.priceAtPurchase || p.price || 0);
      const qty = Number(p.quantity || 1);
      const delivery = Number(p.deliveryCharges || 0);
      const isFree = Boolean(p.isFreeDelivery);

      itemsSubtotal += unitPrice * qty;
      if (!isFree && delivery > 0) {
        totalDelivery += delivery;
      }

      return {
        product: prodId,
        quantity: qty,
        priceAtPurchase: unitPrice,
        originalBasePrice: Number(p.originalBasePrice || p.price || unitPrice),
        websiteDiscountedPrice: Number(p.websiteDiscountedPrice || (p.hasDiscount ? p.discountedPrice : unitPrice)),
        companyDiscountedPrice: Number(p.companyDiscountedPrice || 0),
        hasCompanyDiscount: Boolean(p.companyDiscountedPrice && p.companyDiscountedPrice < unitPrice),
        selectedVariant: p.selectedVariant || '',
        deliveryCharges: delivery,
        isFreeDelivery: isFree
      };
    });

    // Calculate tax according to payment method:
    // COD: 6%, Pay Some Advance: 4%, Advance Payment: 2%
    let taxPercent = 0.06;
    if (paymentMethod === 'Pay Some Advance') taxPercent = 0.04;
    else if (paymentMethod === 'Advance Payment') taxPercent = 0.02;

    const rawTotal = itemsSubtotal + totalDelivery;
    const salesTax = Math.round(rawTotal * taxPercent);
    const initialPayable = rawTotal + salesTax;
    const orderDiscount = Number(companyDiscount || 0);
    const totalAmount = Math.max(0, initialPayable - orderDiscount);

    let advanceAmount = 0;
    let totalDueAmount = totalAmount;

    if (paymentMethod === 'Pay Some Advance') {
      advanceAmount = calculateAdvanceRequired(itemsSubtotal);
      // Cap advance so it never exceeds total payable
      advanceAmount = Math.min(advanceAmount, totalAmount);
      totalDueAmount = Math.max(0, totalAmount - advanceAmount);
    } else if (paymentMethod === 'Advance Payment') {
      advanceAmount = totalAmount;
      totalDueAmount = 0;
    } else {
      advanceAmount = 0;
      totalDueAmount = totalAmount;
    }

    // Set initial status and paymentStatus
    let initialStatus = 'Pending';
    let initialPaymentStatus = 'Pending';

    if (paymentMethod === 'Pay Some Advance' || paymentMethod === 'Advance Payment') {
      initialPaymentStatus = 'Under Review';
      initialStatus = 'Pending Payment';
    }

    // Admin can choose custom status when creating order directly
    if (isAdmin && requestedStatus && typeof requestedStatus === 'string') {
      initialStatus = requestedStatus;
    }

    const orderId = await generateOrderId();

    const order = await Order.create({
      orderId,
      customerDetails: finalCustDetails,
      products: formattedProducts,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentProofImage: paymentProofImage || '',
      bankSelected: bankSelected || '',
      salesTax,
      advanceAmount,
      totalDueAmount,
      companyDiscount: orderDiscount,
      originalTotalAmount: initialPayable,
      totalAmount,
      status: initialStatus
    });

    const populatedOrder = await Order.findById(order._id).populate('products.product', 'name images price hasDiscount discountedPrice closeCOD');

    // Send Brevo email notification only for storefront customer orders (NOT for admin-created orders)
    if (!isAdmin && process.env.BREVO_API_KEY && (process.env.ADMIN_EMAIL || process.env.BREVO_SENDER_EMAIL)) {
      sendOrderEmail(populatedOrder).catch(emailErr => {
        console.error('[Email Error] Brevo notification failed:', emailErr && emailErr.message);
      });
    }

    const pusher = req.app.get('pusher');
    if (pusher) {
      try {
        pusher.trigger('mhq-reseller', 'order:new', populatedOrder).catch(e => console.warn('Pusher trigger failed:', e && e.message));
      } catch (pe) {
        console.warn('Pusher synchronous trigger error:', pe.message);
      }
    }

    res.status(201).json({ success: true, order: populatedOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send transactional email via Brevo with payment method highlighted
async function sendOrderEmail(order) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const recipientEmail = process.env.ADMIN_EMAIL || 'mhqreseller@gmail.com';
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

  let paymentDetailsHtml = '';
  if (order.paymentMethod === 'Pay Some Advance') {
    paymentDetailsHtml = `
      <div style="background:#202023;border:1px solid #f59e0b40;border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;">
        <div style="color:#fbbf24;font-weight:bold;margin-bottom:4px;">💳 Pay Some Advance (PSA)</div>
        <div>Bank Selected: <strong>${order.bankSelected || 'N/A'}</strong></div>
        <div>Advance Paid: <strong style="color:#34d399;">Rs ${order.advanceAmount}</strong></div>
        <div>Remaining Due on Delivery: <strong style="color:#fbbf24;">Rs ${order.totalDueAmount}</strong></div>
        ${order.paymentProofImage ? `<div style="margin-top:6px;"><a href="${order.paymentProofImage}" target="_blank" style="color:#60a5fa;text-decoration:underline;">View Payment Proof Screenshot &rarr;</a></div>` : ''}
      </div>
    `;
  } else if (order.paymentMethod === 'Advance Payment') {
    paymentDetailsHtml = `
      <div style="background:#202023;border:1px solid #34d39940;border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;">
        <div style="color:#34d399;font-weight:bold;margin-bottom:4px;">💳 Full Advance Payment</div>
        <div>Bank Selected: <strong>${order.bankSelected || 'N/A'}</strong></div>
        <div>Total Paid: <strong style="color:#34d399;">Rs ${order.totalAmount}</strong></div>
        ${order.paymentProofImage ? `<div style="margin-top:6px;"><a href="${order.paymentProofImage}" target="_blank" style="color:#60a5fa;text-decoration:underline;">View Payment Proof Screenshot &rarr;</a></div>` : ''}
      </div>
    `;
  }

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;">
    <div style="max-width:600px;margin:20px auto;background:#18181b;border:1px solid #d9770640;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
      <div style="background:#000000;padding:26px 20px;text-align:center;border-bottom:2px solid #f59e0b;">
        <h1 style="color:#ffffff;font-size:26px;margin:0;font-family:Georgia,serif;letter-spacing:1px;">MHQ Reseller <span style="color:#fbbf24;font-size:16px;font-weight:normal;">(Broker)</span></h1>
        <p style="color:#a1a1aa;margin:5px 0 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;">New Customer Order Notification</p>
      </div>

      <div style="padding:24px;">
        <div style="background:#27272a;border:1px solid #fbbf2440;border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Order ID</div>
            <div style="color:#fbbf24;font-size:24px;font-weight:900;font-family:monospace;letter-spacing:1.5px;margin-top:2px;">${order.orderId || ('#' + order._id.toString().slice(-6))}</div>
          </div>
          <div style="text-align:right;">
            <span style="background:#f59e0b;color:#000000;font-weight:bold;font-size:12px;padding:4px 10px;border-radius:20px;">${order.paymentMethod}</span>
          </div>
        </div>

        ${paymentDetailsHtml}

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
            <span style="color:#a1a1aa;font-size:14px;">Total Payable Amount:</span>
            <span style="color:#fbbf24;font-size:22px;font-weight:900;">Rs ${Number(order.totalAmount).toLocaleString()}</span>
          </div>
          ${order.totalDueAmount > 0 && order.paymentMethod === 'Pay Some Advance' ? `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:13px;color:#a1a1aa;">
              <span>Total Due on Delivery:</span>
              <span style="color:#ffffff;font-weight:bold;">Rs ${Number(order.totalDueAmount).toLocaleString()}</span>
            </div>
          ` : ''}
        </div>

        <p style="text-align:center;color:#52525b;font-size:11px;margin:18px 0 0 0;">
          MHQ Reseller (Broker) Automated Order Dispatch System<br>
          <span style="color:#71717a;font-weight:600;">Powered By MHT Devs</span>
        </p>
      </div>
    </div>
  </body>
  </html>`;

  const orderCode = order.orderId || ('#' + order._id.toString().slice(-6));
  const payload = JSON.stringify({
    sender: { name: 'MHQ Reseller Orders', email: senderEmail },
    to: [{ email: recipientEmail, name: 'Store Owner' }],
    subject: `New Order (${orderCode}) - (${order.paymentMethod}) - Rs ${order.totalAmount}`,
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
          resolve(body);
        } else {
          reject(new Error(`Brevo HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.setTimeout(5000, () => {
      req.destroy(new Error('Brevo email request timed out after 5s'));
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

// Update order status (Pending, Packed, Ready to Ship, etc.)
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('products.product', 'name images price hasDiscount discountedPrice closeCOD');
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });

    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'order:updated', order);

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve or Decline pending payments
const updatePaymentStatus = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'decline'
    let updates = {};
    if (action === 'approve') {
      updates.paymentStatus = 'Approved';
      updates.status = 'Pending'; // Moves to regular Orders list on pending status
    } else if (action === 'decline') {
      updates.paymentStatus = 'Declined';
      updates.status = 'Payment Declined';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('products.product', 'name images price hasDiscount discountedPrice closeCOD');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const pusher = req.app.get('pusher');
    if (pusher) {
      await pusher.trigger('mhq-reseller', 'order:updated', order);
      await pusher.trigger('mhq-reseller', 'payment:updated', order);
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Apply company discount (per product and/or overall order discount)
const applyDiscount = async (req, res) => {
  try {
    const { orderDiscount = 0, productDiscounts = [] } = req.body;
    const order = await Order.findById(req.params.id).populate('products.product');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    let itemsTotal = 0;
    let deliveryTotal = 0;

    order.products.forEach(p => {
      const prodId = p.product && p.product._id ? p.product._id.toString() : (p.product ? p.product.toString() : '');
      const itemId = p._id ? p._id.toString() : '';
      const match = productDiscounts.find(pd => 
        (pd.productId && pd.productId.toString() === prodId) || 
        (pd.productItemId && pd.productItemId.toString() === itemId)
      );
      if (match && typeof match.companyDiscountedPrice === 'number' && match.companyDiscountedPrice > 0) {
        p.companyDiscountedPrice = match.companyDiscountedPrice;
        p.hasCompanyDiscount = true;
        p.priceAtPurchase = match.companyDiscountedPrice;
      }
      itemsTotal += p.priceAtPurchase * p.quantity;
      if (!p.isFreeDelivery && p.deliveryCharges > 0) {
        deliveryTotal += p.deliveryCharges;
      }
    });

    const overallDiscount = Number(orderDiscount || 0);
    order.companyDiscount = overallDiscount;

    const basePayable = itemsTotal + deliveryTotal + (order.salesTax || 0);
    order.originalTotalAmount = order.originalTotalAmount || basePayable;
    order.totalAmount = Math.max(0, basePayable - overallDiscount);

    if (order.paymentMethod === 'Pay Some Advance') {
      order.totalDueAmount = Math.max(0, order.totalAmount - (order.advanceAmount || 0));
    } else if (order.paymentMethod === 'Advance Payment') {
      order.totalDueAmount = 0;
    } else {
      order.totalDueAmount = order.totalAmount;
    }

    await order.save();
    const updated = await Order.findById(order._id).populate('products.product', 'name images price hasDiscount discountedPrice closeCOD');

    const pusher = req.app.get('pusher');
    if (pusher) await pusher.trigger('mhq-reseller', 'order:updated', updated);

    res.json({ success: true, order: updated });
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
    const pendingPayments = await Order.countDocuments({ paymentStatus: 'Under Review' });
    const deliveredOrdersList = await Order.find({ status: 'Delivered' });
    const deliveredOrders = deliveredOrdersList.length;
    const totalRevenue = deliveredOrdersList.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        pendingPayments,
        deliveredOrders,
        totalRevenue
      }
    });
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

module.exports = {
  getAll,
  getOne,
  create,
  updateStatus,
  updatePaymentStatus,
  applyDiscount,
  remove,
  bulkDelete,
  getStats
};
