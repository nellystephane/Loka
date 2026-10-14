const express = require('express');
const router = express.Router();
const { creerLitige, mesLitiges } = require('../controllers/litigeController');
const auth = require('../middleware/auth');

router.post('/', auth, creerLitige);
router.get('/moi', auth, mesLitiges);

module.exports = router;
