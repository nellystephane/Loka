const express = require('express');
const router = express.Router();
const { initierPaiement, getPaymentStatus } = require('../controllers/paiementCommandeController');
const auth = require('../middleware/auth');
const { validerInitiationPaiement } = require('../utils/validation');

// ─── Le webhook n'est PAS monté ici : il a besoin du corps brut (raw body)
// pour la vérification de signature FedaPay, donc il est déclaré directement
// dans index.js, avant le middleware express.json() global. ───
router.post('/initier', auth, validerInitiationPaiement, initierPaiement);
router.get('/:id', auth, getPaymentStatus);

module.exports = router;
