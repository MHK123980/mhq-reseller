const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Make io accessible in controllers
app.set('io', io);

// MongoDB Cached Connection for Vercel Serverless
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set in environment!');
    return;
  }
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
}

// Middleware to ensure DB connection before handling request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'MHQ Reseller API is running on Vercel ✅', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.json({ message: 'MHQ Reseller API is running on Vercel ✅', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;

// Run standalone server if executed directly (Local development)
if (require.main === module) {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Local Server running on http://localhost:${PORT}`);
    });
  });
}

// Export Express app for Vercel Serverless Functions
module.exports = app;
