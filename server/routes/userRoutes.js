const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfil,
  updateProfil,
  changePassword,
  deleteAccount,
  toggleFavori,
  getFavoris,
  loginGoogle,
  verifierEmail,
  renvoyerVerification,
  demanderResetMotDePasse,
  resetMotDePasse
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// ─── Routes publiques ───
router.post('/register', register);
router.post('/login', login);
router.post('/google', loginGoogle);
router.get('/verification-email', verifierEmail);
router.post('/verification-email/renvoyer', renvoyerVerification);
router.post('/password/forgot', demanderResetMotDePasse);
router.post('/password/reset', resetMotDePasse);

// ─── Routes protégées ───
router.get('/profil', auth, getProfil);
router.put('/profil', auth, updateProfil);
router.put('/password', auth, changePassword);
router.delete('/', auth, deleteAccount);       // DELETE /api/users
router.get('/favoris', auth, getFavoris);
router.put('/favoris/:annonceId', auth, toggleFavori);

module.exports = router;
