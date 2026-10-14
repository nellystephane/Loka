const express = require('express');
const router = express.Router();
const {
  statistiques, listerUtilisateurs, suspendreUtilisateur, reactiverUtilisateur,
  listerLitiges, traiterLitige, listerSoldesAVerser, creerPayout, traiterPayout
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// ─── Toutes les routes de ce fichier sont réservées aux administrateurs
// (chantier back-office, priorité 7 de la section 11.1) : `auth` peuple
// req.user, `adminAuth` vérifie ensuite le rôle. ───
router.use(auth, adminAuth);

router.get('/statistiques', statistiques);

router.get('/utilisateurs', listerUtilisateurs);
router.put('/utilisateurs/:id/suspendre', suspendreUtilisateur);
router.put('/utilisateurs/:id/reactiver', reactiverUtilisateur);

router.get('/litiges', listerLitiges);
router.put('/litiges/:id/traiter', traiterLitige);

router.get('/payouts', listerSoldesAVerser);
router.post('/payouts', creerPayout);
router.put('/payouts/:id', traiterPayout);

module.exports = router;
