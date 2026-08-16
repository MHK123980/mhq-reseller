const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  hasDiscount: {
    type: Boolean,
    default: false
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  deliveryCharges: {
    type: Number,
    default: 0
  },
  isFreeDelivery: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isLowInStock: {
    type: Boolean,
    default: false
  },
  isOutOfStock: {
    type: Boolean,
    default: false
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String, // URLs from ImgBB
    required: true
  }]
}, { timestamps: true });

// Virtual field to calculate discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.hasDiscount && this.discountPercent > 0) {
    return this.price - (this.price * (this.discountPercent / 100));
  }
  return this.price;
});

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
