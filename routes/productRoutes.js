const router = require('express').Router();
const { getAll, getOne, create, update, remove, bulkDelete, toggleFeatured, toggleOutOfStock } = require('../controllers/productController');
const { protectAPI } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/bulk-delete', protectAPI, bulkDelete);
router.post('/', protectAPI, create);
router.put('/:id', protectAPI, update);
router.delete('/:id', protectAPI, remove);
router.patch('/:id/toggle-featured', protectAPI, toggleFeatured);
router.patch('/:id/toggle-out-of-stock', protectAPI, toggleOutOfStock);

module.exports = router;
