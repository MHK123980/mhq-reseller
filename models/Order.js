const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, sparse: true },
  courierCompany: { type: String, default: '' },
  courierTrackingNo: { type: String, default: '' },
  customerDetails: {
    fullName: { type: String, required: true, default: 'Customer' },
    phoneNo: { type: String, required: true, default: '-' },
    houseNo: { type: String, default: '' },
    streetNameNo: { type: String, default: '' },
    areaName: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    famousPlace: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1 },
    priceAtPurchase: { type: Number, required: true },
    originalBasePrice: { type: Number, default: 0 },
    websiteDiscountedPrice: { type: Number, default: 0 },
    companyDiscountedPrice: { type: Number, default: 0 },
    hasCompanyDiscount: { type: Boolean, default: false },
    selectedVariant: { type: String, default: '' },
    deliveryCharges: { type: Number, default: 0 },
    isFreeDelivery: { type: Boolean, default: false }
  }],
  paymentMethod: {
    type: String,
    enum: ['COD', 'Pay Some Advance', 'Advance Payment'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['Under Review', 'Approved', 'Declined', 'Paid', 'Pending'],
    default: 'Pending'
  },
  paymentProofImage: { type: String, default: '' },
  bankSelected: { type: String, default: '' },
  salesTax: { type: Number, default: 0 },
  advanceAmount: { type: Number, default: 0 },
  totalDueAmount: { type: Number, default: 0 },
  companyDiscount: { type: Number, default: 0 },
  originalTotalAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: [
      'Pending Payment',
      'Payment Declined',
      'Pending',
      'Packed',
      'Ready to Ship',
      'On Route',
      'Out for Delivery',
      'Delivered',
      'Canceled'
    ],
    default: 'Pending',
  },
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
