const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/catalogueBoutiqueController');

router.get('/schema', auth, controller.schemaSuggestions);
router.get('/profile', auth, controller.profile);
router.get('/categories', auth, controller.categories);
router.post('/categories', auth, controller.createCategory);
router.get('/collections', auth, controller.collections);
router.post('/collections', auth, controller.createCollection);

module.exports = router;
