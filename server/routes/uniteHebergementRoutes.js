const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUnitesChambre, createUnite, updateUnite, deleteUnite } = require('../controllers/uniteHebergementController');

router.get('/chambre/:chambreId', auth, getUnitesChambre);
router.post('/', auth, createUnite);
router.put('/:id', auth, updateUnite);
router.delete('/:id', auth, deleteUnite);

module.exports = router;
