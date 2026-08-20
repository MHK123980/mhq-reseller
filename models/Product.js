const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isFeatured: { type: Boolean, default: false },
  hasDiscount: { type: Boolean, default: false },
  discountedPrice: { type: Number, default: 0 },   // Admin enters discounted price
  discountPercent: { type: Number, default: 0 },   // Auto-calculated from price & discountedPrice
  isFreeDelivery: { type: Boolean, default: false },
  deliveryCharges: { type: Number, default: 0 },
  isLowInStock: { type: Boolean, default: false },
  isOutOfStock: { type: Boolean, default: false },
  // Variants: e.g. [{ label: "Color", options: [{ name: "Red", price: 0 }, { name: "Blue", price: 50 }] }]
  variants: [{
    label: { type: String, required: true },
    options: [{
      name: { type: String, required: true },
      extraPrice: { type: Number, default: 0 }  // 0 = same as base price
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
