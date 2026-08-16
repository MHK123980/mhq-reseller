const router = require('express').Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Setting = require('../models/Setting');
const { protect } = require('../middleware/auth');

const PUSHER_KEY = process.env.PUSHER_KEY || "f713f77ab9e98a84ccf7";
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER || "ap2";

// Homepage - fetch categories, featured products, all products server-side
router.get('/', async (req, res) => {
  const categories = await Category.find();
  const featured = await Product.find({isFeatured: true}).populate('category','name').limit(8);
  const products = await Product.find().populate('category','name').sort({createdAt:-1});
  res.render('index', { categories, featured, products,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: 'MHQ Reseller - Quality Products' });
});

router.get('/products', async (req, res) => {
  const products = await Product.find().populate('category','name').sort({createdAt:-1});
  const categories = await Category.find();
  res.render('products', { products, categories,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: 'All Products - MHQ Reseller' });
});

router.get('/featuredproducts', async (req, res) => {
  const products = await Product.find({isFeatured:true}).populate('category','name');
  res.render('featuredproducts', { products,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: 'Featured Products - MHQ Reseller' });
});

router.get('/product/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category','name');
  if (!product) return res.redirect('/');
  res.render('product-detail', { product,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: product.name + ' - MHQ Reseller' });
});

router.get('/cart', async (req, res) => {
  const estTimeSetting = await Setting.findOne({ key: 'estimatedDeliveryTime' });
  res.render('cart', {
    estimatedDeliveryTime: estTimeSetting ? estTimeSetting.value : '3-5 Days',
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    title: 'Cart - MHQ Reseller' });
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

router.get('/admin/dashboard/users', protect, async (req, res) => {
  const User = require('../models/User');
  const users = await User.find().select('-password').sort({createdAt:-1});
  res.render('admin/users', { layout: 'layouts/admin', users,
    pusherKey: PUSHER_KEY, pusherCluster: PUSHER_CLUSTER,
    user: req.user, title: 'Users - MHQ Admin' });
});

module.exports = router;
