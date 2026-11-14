const router = require('express').Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Setting = require('../models/Setting');
const { protect } = require('../middleware/auth');

const PUSHER_KEY = process.env.PUSHER_KEY || "f713f77ab9e98a84ccf7";
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER || "ap2";

// Homepage - fetch categories, featured products, all products server-side
router.get('/', async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  const featured = await Product.find({isFeatured: true}).populate('category','name').sort({createdAt:-1}).limit(8);
  const products = await Product.find().populate('category','name').sort({createdAt:-1});
  res.render('index', { categories, featured, products,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: 'MHQ Reseller (Broker) - Quality Products' });
});

router.get('/products', async (req, res) => {
  const products = await Product.find().populate('category','name').sort({createdAt:-1});
  const categories = await Category.find().sort({ name: 1 });
  res.render('products', { products, categories,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: 'All Products - MHQ Reseller (Broker)' });
});

router.get('/featuredproducts', async (req, res) => {
  const products = await Product.find({isFeatured:true}).populate('category','name').sort({createdAt:-1});
  const categories = await Category.find().sort({ name: 1 });
  res.render('featuredproducts', { products, categories,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: 'Featured Products - MHQ Reseller (Broker)' });
});

router.get('/product/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category','name');
  if (!product) return res.redirect('/');
  const categories = await Category.find().sort({ name: 1 });
  res.render('product-detail', { product, categories,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: product.name + ' - MHQ Reseller (Broker)' });
});

router.get('/cart', async (req, res) => {
  const estTimeSetting = await Setting.findOne({ key: 'estimatedDeliveryTime' });
  const categories = await Category.find().sort({ name: 1 });
  res.render('cart', {
    categories,
    estimatedDeliveryTime: estTimeSetting ? estTimeSetting.value : '3-5 Days',
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: 'Cart - MHQ Reseller (Broker)' });
});

router.get('/track-order', async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.render('track-order', {
    categories,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: 'Track Your Order - MHQ Reseller (Broker)'
  });
});

// Admin pages
router.get('/admin', (req, res) => {
  res.render('admin/login', { layout: 'layouts/admin', title: 'Admin Login - MHQ Reseller', error: null });
});

router.get('/admin/dashboard', protect, (req, res) => {
  res.render('admin/dashboard', { layout: 'layouts/admin',
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    user: req.user, title: 'Dashboard - MHQ Admin' });
});

router.get('/admin/dashboard/settings', protect, async (req, res) => {
  const estTimeSetting = await Setting.findOne({ key: 'estimatedDeliveryTime' });
  res.render('admin/settings', { layout: 'layouts/admin',
    estimatedDeliveryTime: estTimeSetting ? estTimeSetting.value : '3-5 Days',
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    user: req.user, title: 'Settings - MHQ Admin' });
});

router.get('/admin/dashboard/products', protect, async (req, res) => {
  const products = await Product.find().populate('category','name').sort({createdAt:-1});
  const categories = await Category.find();
  res.render('admin/products', { layout: 'layouts/admin', products, categories,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    user: req.user, title: 'Products - MHQ Admin' });
});

router.get('/admin/dashboard/categories', protect, async (req, res) => {
  const categories = await Category.find().sort({createdAt:-1});
  res.render('admin/categories', { layout: 'layouts/admin', categories,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    user: req.user, title: 'Categories - MHQ Admin' });
});

router.get('/admin/dashboard/orders', protect, async (req, res) => {
  const Order = require('../models/Order');
  const orders = await Order.find().populate('products.product','name images price').sort({createdAt:-1});
  res.render('admin/orders', { layout: 'layouts/admin', orders,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    user: req.user, title: 'Orders - MHQ Admin' });
});

router.get('/admin/dashboard/courier-tracking', protect, async (req, res) => {
  const Order = require('../models/Order');
  const CourierTracking = require('../models/CourierTracking');
  const orders = await Order.find({ orderId: { $exists: true, $ne: '' } }).select('orderId customerDetails.fullName totalAmount status').sort({ createdAt: -1 });
  const trackings = await CourierTracking.find().populate('order', 'orderId customerDetails.fullName').sort({ createdAt: -1 });
  res.render('admin/courier-tracking', { layout: 'layouts/admin', orders, trackings,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    user: req.user, title: 'Courier Tracking - MHQ Admin' });
});

router.get('/admin/dashboard/users', protect, async (req, res) => {
  const User = require('../models/User');
  const users = await User.find().select('-password').sort({createdAt:-1});
  res.render('admin/users', { layout: 'layouts/admin', users,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    user: req.user, title: 'Users - MHQ Admin' });
});

module.exports = router;
