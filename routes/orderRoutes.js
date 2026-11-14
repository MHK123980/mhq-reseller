const router = require('express').Router();
const { getAll, getOne, create, updateStatus, remove, bulkDelete, getStats } = require('../controllers/orderController');
const { protectAPI } = require('../middleware/auth');

router.get('/', protectAPI, getAll);
router.get('/stats', protectAPI, getStats);
router.post('/bulk-delete', protectAPI, bulkDelete);
router.get('/:id', getOne); // public — for order tracking
router.post('/', create);
router.put('/:id/status', protectAPI, updateStatus);
router.delete('/:id', protectAPI, remove);

module.exports = router;
