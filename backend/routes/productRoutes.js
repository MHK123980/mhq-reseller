const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.get('/', productController.getAll);
router.get('/:id', productController.getOne);

// Admin
router.post('/', protect, productController.create);
router.put('/:id', protect, productController.update);
router.delete('/:id', protect, productController.remove);
router.patch('/:id/toggle-featured', protect, productController.toggleFeatured);
router.patch('/:id/toggle-out-of-stock', protect, productController.toggleOutOfStock);

module.exports = router;
