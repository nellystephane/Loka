const express = require('express');
const router = express.Router();
const {
  getMesAchats,
  getCommandesRecues,
  updateStatutCommande
} = require('../controllers/commandeController');
const auth = require('../middleware/auth');

// ─── POST / a été retiré : une commande n'est plus créée directement, elle
// naît du paiement FedaPay confirmé. Utilisez désormais
// POST /api/paiements-commande/initier avec { contexte: { type: 'panier_boutique', panier: {...} } },
// puis redirigez vers le lienPaiement retourné. Voir paiementCommandeController.js. ───
router.get('/mes-achats', auth, getMesAchats);
router.get('/recues', auth, getCommandesRecues);
router.put('/:id/statut', auth, updateStatutCommande);

module.exports = router;
