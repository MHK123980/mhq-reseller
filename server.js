require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const Pusher = require('pusher');

const app = express();

// Pusher init
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2186529",
  key: process.env.PUSHER_KEY || "f713f77ab9e98a84ccf7",
  secret: process.env.PUSHER_SECRET || "eacde0a320a88b667184",
  cluster: process.env.PUSHER_CLUSTER || "ap2",
  useTLS: true
});
app.set('pusher', pusher);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// DB connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
};

// Routes
const pageRoutes = require('./routes/pageRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

app.use(async (req, res, next) => { await connectDB(); next(); });

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

const Setting = require('./models/Setting');
const { protectAPI } = require('./middleware/auth');
app.post('/api/settings', protectAPI, async (req, res) => {
  try {
    const { key, value } = req.body;
    await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Image upload proxy - avoids browser CORS issues with ImgBB
app.post('/api/upload', async (req, res) => {
  try {
    const { imageBase64, fileName } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, message: 'No image provided' });

    const IMGBB_KEY = process.env.IMGBB_KEY || 'd26bb3aafef1e75c324e7ce3072e3b47';

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Use built-in https - ImgBB accepts urlencoded base64
    const https = require('https');
    const querystring = require('querystring');
    const postData = querystring.stringify({ image: base64Data, ...(fileName ? { name: fileName } : {}) });

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.imgbb.com',
        path: `/1/upload?key=${IMGBB_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const reqHttp = https.request(options, (httpRes) => {
        let data = '';
        httpRes.on('data', chunk => data += chunk);
        httpRes.on('end', () => {
          try { resolve(JSON.parse(data)); } catch(e) { reject(new Error('Invalid JSON from ImgBB')); }
        });
      });
      reqHttp.on('error', reject);
      reqHttp.write(postData);
      reqHttp.end();
    });

    if (result.data && result.data.url) {
      return res.json({ success: true, url: result.data.url });
    }
    return res.status(500).json({ success: false, message: result.error?.message || 'ImgBB upload failed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use('/', pageRoutes);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
