const router = require('express').Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

// Homepage - fetch categories, featured products, all products server-side
router.get('/', async (req, res) => {
  const categories = await Category.find();
  const featured = await Product.find({isFeatured: true}).populate('category','name').limit(8);
  const products = await Product.find().populate('category','name').sort({createdAt:-1});
  res.render('index', { categories, featured, products,
    pusherKey: process.env.PUSHER_KEY, pusherCluster: process.env.PUSHER_CLUSTER,
    title: 'MHQ Reseller - Quality Products' });
});

router.get('/products', async (req, res) => {
  const products = await Product.find().populate('category','name').sort({createdAt:-1});
  const categories = await Category.find();
  res.render('products', { products, categories,
    pusherKey: process.env.PUSHER_KEY, pusherCluster: process.env.PUSHER_CLUSTER,
    title: 'All Products - MHQ Reseller' });
});

router.get('/featuredproducts', async (req, res) => {
  const products = await Product.find({isFeatured:true}).populate('category','name');
  res.render('featuredproducts', { products,
    pusherKey: process.env.PUSHER_KEY, pusherCluster: process.env.PUSHER_CLUSTER,
    title: 'Featured Products - MHQ Reseller' });
});

router.get('/product/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category','name');
  if (!product) return res.redirect('/');
  res.render('product-detail', { product,
    pusherKey: process.env.PUSHER_KEY, pusherCluster: process.env.PUSHER_CLUSTER,
    title: product.name + ' - MHQ Reseller' });
});

router.get('/cart', (req, res) => {
  res.render('cart', {
    pusherKey: process.env.PUSHER_KEY, pusherCluster: process.env.PUSHER_CLUSTER,
    title: 'Cart - MHQ Reseller' });
});

// Admin pages
router.get('/admin', (req, res) => {
  res.render('admin/login', { layout: 'layouts/admin', title: 'Admin Login - MHQ Reseller', error: null });
});

router.get('/admin/dashboard', protect, (req, res) => {
  res.render('admin/dashboard', { layout: 'layouts/admin',
    pusherKey: process.env.PUSHER_KEY, pusherCluster: process.env.PUSHER_CLUSTER,
    user: req.user, title: 'Dashboard - MHQ Admin' });
});

router.get('/admin/dashboard/products', protect, async (req, res) => {
  const products = await Product.find().populate('category','name').sort({createdAt:-1});
  const categories = await Category.find();
  res.render('admin/products', { layout: 'layouts/admin', products, categories,
    pusherKey: process.env.PUSHER_KEY, pusherCluster: process.env.PUSHER_CLUSTER,
    user: req.user, title: 'Products - MHQ Admin' });
});

router.get('/admin/dashboard/categories', protect, async (req, res) => {
  const categories = await Category.find().sort({createdAt:-1});
  res.render('admin/categories', { layout: 'layouts/admin', categories,
    pusherKey: process.env.PUSHER_KEY, pusherCluster: process.env.PUSHER_CLUSTER,
    user: req.user, title: 'Categories - MHQ Admin' });
});

router.get('/admin/dashboard/orders', protect, async (req, res) => {
  const Order = require('../models/Order');
  const orders = await Order.find().populate('products.product','name images price').sort({createdAt:-1});
  res.render('admin/orders', { layout: 'layouts/admin', orders,
    pusherKey: process.env.PUSHER_KEY, pusherCluster: process.env.PUSHER_CLUSTER,
    user: req.user, title: 'Orders - MHQ Admin' });
});

router.get('/admin/dashboard/users', protect, async (req, res) => {
  const User = require('../models/User');
  const users = await User.find().select('-password').sort({createdAt:-1});
  res.render('admin/users', { layout: 'layouts/admin', users,
    pusherKey: process.env.PUSHER_KEY, pusherCluster: process.env.PUSHER_CLUSTER,
    user: req.user, title: 'Users - MHQ Admin' });
});

module.exports = router;
