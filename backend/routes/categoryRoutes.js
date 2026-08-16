const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.get('/', categoryController.getAll);

// Admin
router.post('/', protect, categoryController.create);
router.put('/:id', protect, categoryController.update);
router.delete('/:id', protect, categoryController.remove);

module.exports = router;
