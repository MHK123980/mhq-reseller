const router = require('express').Router();
const { getAll, create, update, remove } = require('../controllers/paymentAccountController');
const { protectAPI } = require('../middleware/auth');

router.get('/', getAll); // public for checkout when ?public=true, full list for admin
router.post('/', protectAPI, create);
router.put('/:id', protectAPI, update);
router.delete('/:id', protectAPI, remove);

module.exports = router;
