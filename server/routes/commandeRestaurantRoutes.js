const express = require('express');
const router = express.Router();
const {
  getMesAchats,
  getCommandesRecues,
  updateStatutCommande
} = require('../controllers/commandeRestaurantController');
const auth = require('../middleware/auth');

// ─── POST / a été retiré : voir POST /api/paiements-commande/initier avec
// { contexte: { type: 'panier_restaurant', panier: {...} } }. ───
router.get('/mes-achats', auth, getMesAchats);
router.get('/recues', auth, getCommandesRecues);
router.put('/:id/statut', auth, updateStatutCommande);

module.exports = router;
