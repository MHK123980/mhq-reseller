const router = require('express').Router();
const { getAll, create, updateStatus, remove, bulkDelete, getStats } = require('../controllers/orderController');
const { protectAPI } = require('../middleware/auth');

router.get('/', protectAPI, getAll);
router.get('/stats', protectAPI, getStats);
router.post('/bulk-delete', protectAPI, bulkDelete);
router.post('/', create);
router.put('/:id/status', protectAPI, updateStatus);
router.delete('/:id', protectAPI, remove);

module.exports = router;
