import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI!;
let isConnected = false;

export async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI);
  isConnected = true;
}

// ---- Models ----
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
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

const OrderSchema = new mongoose.Schema({
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
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Packed', 'Ready to Ship', 'On Route', 'Out for Delivery', 'Delivered', 'Canceled'],
    default: 'Pending',
  },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['Owner', 'Admin', 'Manager'], default: 'Manager' },
}, { timestamps: true });

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
