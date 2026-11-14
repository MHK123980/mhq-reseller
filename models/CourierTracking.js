const mongoose = require('mongoose');
const courierSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderId: { type: String, required: true },
  courierCompany: { type: String, required: true }, // TCS, PostEx, Leopard, M&B, Other
  courierName: { type: String, default: '' }, // used when courierCompany = 'Other'
  trackingNumber: { type: String, required: true },
}, { timestamps: true });
module.exports = mongoose.models.CourierTracking || mongoose.model('CourierTracking', courierSchema);
