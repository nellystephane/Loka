const express = require('express');
const router = express.Router();
const {
  createDemande,
  getDemandesDisponibles,
  accepterDemande,
  updateStatutDemande,
  getMesLivraisons,
  getMesDemandes,
  estimerLivraison,
  validerRecuperation,
  validerLivraison,
  assignerLivraison,
  getDemandeById
} = require('../controllers/demandeLivraisonController');
const auth = require('../middleware/auth');

router.post('/', auth, createDemande);
router.post('/estimer', auth, estimerLivraison);
router.get('/disponibles', auth, getDemandesDisponibles);
router.get('/mes-livraisons', auth, getMesLivraisons);
router.get('/mes-demandes', auth, getMesDemandes);
router.get('/:id', auth, getDemandeById);
router.put('/:id/accepter', auth, accepterDemande);
router.put('/:id/assigner', auth, assignerLivraison);
router.put('/:id/statut', auth, updateStatutDemande);
router.put('/:id/recuperation', auth, validerRecuperation);
router.put('/:id/livraison', auth, validerLivraison);

module.exports = router;
