const express = require('express');
const router = express.Router();
const {
  creerOffreLivraison,
  getOffreLivraison,
  accepterOffreLivraison,
  contreProposerOffreLivraison,
  refuserOffreLivraison,
  annulerOffreLivraison
} = require('../controllers/offreLivraisonController');
const auth = require('../middleware/auth');

router.post('/', auth, creerOffreLivraison);
router.get('/:id', auth, getOffreLivraison);
router.put('/:id/accepter', auth, accepterOffreLivraison);
router.put('/:id/contre-proposition', auth, contreProposerOffreLivraison);
router.put('/:id/refuser', auth, refuserOffreLivraison);
router.put('/:id/annuler', auth, annulerOffreLivraison);

module.exports = router;
