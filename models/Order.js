const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  customerDetails: {
    fullName: { type: String, required: true },
    phoneNo: { type: String, required: true },
    houseNo: { type: String, required: true },
    streetNameNo: { type: String, required: true },
    areaName: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    famousPlace: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1 },
    priceAtPurchase: { type: Number, required: true },
    selectedVariant: { type: String, default: '' },  // e.g. "Color: Red" or "Size: XL, Color: Blue"
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Packed', 'Ready to Ship', 'On Route', 'Out for Delivery', 'Delivered', 'Canceled'],
    default: 'Pending',
  },
}, { timestamps: true });
module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
