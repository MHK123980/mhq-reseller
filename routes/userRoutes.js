const router = require('express').Router();
const { getAll, create, update, remove } = require('../controllers/userController');
const { protectAPI } = require('../middleware/auth');

router.get('/', protectAPI, getAll);
router.post('/', protectAPI, create);
router.put('/:id', protectAPI, update);
router.delete('/:id', protectAPI, remove);

module.exports = router;
