const router = require('express').Router();
const { getAll, create, updateStatus, remove, getStats } = require('../controllers/orderController');
const { protectAPI } = require('../middleware/auth');

router.get('/', protectAPI, getAll);
router.get('/stats', protectAPI, getStats);
router.post('/', create);
router.put('/:id/status', protectAPI, updateStatus);
router.delete('/:id', protectAPI, remove);

module.exports = router;
