const express = require('express');
const router = express.Router();
const { creerOffre, getOffre, repondreOffre, annulerOffre } = require('../controllers/offreController');
const auth = require('../middleware/auth');

router.post('/', auth, creerOffre);
router.get('/:id', auth, getOffre);
router.put('/:id/reponse', auth, repondreOffre);
router.put('/:id/annuler', auth, annulerOffre);

module.exports = router;
