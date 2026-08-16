const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');

// Public
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

// User Management (Owner only)
router.get('/users', protect, ownerOnly, authController.getAllUsers);
router.post('/users', protect, ownerOnly, authController.createUser);
router.put('/users/:id', protect, ownerOnly, authController.updateUser);
router.delete('/users/:id', protect, ownerOnly, authController.deleteUser);

module.exports = router;
