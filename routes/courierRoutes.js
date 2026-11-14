const router = require('express').Router();
const { getAll, save, getByOrderId, remove } = require('../controllers/courierController');
const { protectAPI } = require('../middleware/auth');

router.get('/', protectAPI, getAll);
router.post('/', protectAPI, save);
router.get('/:orderId', getByOrderId); // public — customer tracking
router.delete('/:id', protectAPI, remove);

module.exports = router;
