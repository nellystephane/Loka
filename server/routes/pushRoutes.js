const express = require('express');
const router = express.Router();
const { clePublique, abonner, desabonner } = require('../controllers/pushController');
const auth = require('../middleware/auth');

router.get('/cle-publique', clePublique);
router.post('/abonner', auth, abonner);
router.delete('/abonner', auth, desabonner);

module.exports = router;
