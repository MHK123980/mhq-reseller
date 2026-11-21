const router = require('express').Router();
const {
  getAll,
  getOne,
  create,
  updateStatus,
  updatePaymentStatus,
  applyDiscount,
  remove,
  bulkDelete,
  getStats
} = require('../controllers/orderController');
const { protectAPI } = require('../middleware/auth');

router.get('/', protectAPI, getAll);
router.get('/stats', protectAPI, getStats);
router.post('/bulk-delete', protectAPI, bulkDelete);
router.get('/:id', getOne); // public — for order tracking
router.post('/', create);
router.put('/:id/status', protectAPI, updateStatus);
router.put('/:id/payment-status', protectAPI, updatePaymentStatus);
router.put('/:id/discount', protectAPI, applyDiscount);
router.delete('/:id', protectAPI, remove);

module.exports = router;
