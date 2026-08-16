const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isFeatured: { type: Boolean, default: false },
  hasDiscount: { type: Boolean, default: false },
  discountPercent: { type: Number, default: 0 },
  isFreeDelivery: { type: Boolean, default: false },
  deliveryCharges: { type: Number, default: 0 },
  isLowInStock: { type: Boolean, default: false },
  isOutOfStock: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
