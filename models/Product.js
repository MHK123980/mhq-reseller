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
  closeCOD: { type: Boolean, default: false },     // When true, disables COD option on checkout if cart has this item
  // Variants: e.g. [{ label: "Color", options: [{ name: "Red", extraPrice: 0, isSoldOut: false }] }]
  variants: [{
    label: { type: String, required: true },
    options: [{
      name: { type: String, required: true },
      extraPrice: { type: Number, default: 0 },   // 0 = same as base price
      isSoldOut: { type: Boolean, default: false } // Marked as sold out / out of stock
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
