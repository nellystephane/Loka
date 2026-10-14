const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createReservation,
  getMesReservations,
  getReservationsRecues,
  updateStatutReservation,
  annulerReservationClient,
  getReservationsChambre,
  getDisponibiliteChambre,
  initierPaiementReservation
} = require('../controllers/reservationController');

router.post('/', auth, createReservation);
router.post('/initier-paiement', auth, initierPaiementReservation);
router.get('/mes-reservations', auth, getMesReservations);
router.get('/recues', auth, getReservationsRecues);
router.get('/disponibilite/:chambreId', getDisponibiliteChambre);
router.get('/chambre/:chambreId', getReservationsChambre);
router.post('/:id/annuler', auth, annulerReservationClient);
router.put('/:id/statut', auth, updateStatutReservation);

module.exports = router;
