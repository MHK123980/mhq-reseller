const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Public - customers can place orders without login
router.post('/', orderController.placeOrder);

// Admin
router.get('/', protect, orderController.getAll);
router.get('/stats', protect, orderController.getStats);
router.get('/:id', protect, orderController.getOne);
router.put('/:id/status', protect, orderController.updateStatus);
router.delete('/:id', protect, orderController.remove);

module.exports = router;
