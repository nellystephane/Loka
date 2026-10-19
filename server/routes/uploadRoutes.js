const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { estStockageS3Actif, televerserVersS3 } = require('../utils/stockageFichiers');

// ─── Stockage local (comportement par défaut, inchangé) — voir
// utils/stockageFichiers.js pour le basculement S3 en production. ───
const storageDisque = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
// ─── Stockage en mémoire, utilisé uniquement quand S3 est configuré : le
// fichier ne touche jamais le disque de l'instance, il part directement
// en buffer vers S3 (utils/stockageFichiers.js). ───
const storageMemoire = multer.memoryStorage();
const stockageActif = () => (estStockageS3Actif() ? storageMemoire : storageDisque);

// ─── Résout l'URL finale du fichier selon le stockage actif — jamais
// l'appelant qui décide, pour ne jamais désynchroniser la route et
// utils/stockageFichiers.js sur qui a la main. ───
const resoudreUrl = async (file) => {
  if (estStockageS3Actif()) {
    return televerserVersS3(file.buffer, file.originalname, file.mimetype);
  }
  return `/uploads/${file.filename}`;
};

const upload = multer({
  storage: stockageActif(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.mimetype)) {
      return cb(new Error('Format non pris en charge. Utilisez JPG, PNG, WebP, GIF ou AVIF.'));
    }
    cb(null, true);
  }
});

// Middleware d'authentification
const auth = require('../middleware/auth');

// POST /api/upload
router.post('/', auth, (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Erreur lors de l\'upload.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé.' });
    }
    try {
      const url = await resoudreUrl(req.file);
      res.json({ url });
    } catch (erreurS3) {
      console.error('Échec du téléversement S3 :', erreurS3);
      res.status(502).json({ message: "Impossible d'enregistrer le fichier pour le moment." });
    }
  });
});

// ─── Pièces jointes de messagerie : images, PDF et documents courants.
// Route distincte de l'upload photo ci-dessus (limite de taille et types
// acceptés différents), pour ne jamais modifier son comportement existant. ───
const TYPES_PIECE_JOINTE = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const uploadPieceJointe = multer({
  storage: stockageActif(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
  fileFilter: (req, file, cb) => {
    if (!TYPES_PIECE_JOINTE.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé. Formats acceptés : images, PDF, Word, Excel, texte.'));
    }
    cb(null, true);
  }
});

// POST /api/upload/piece-jointe
router.post('/piece-jointe', auth, (req, res) => {
  uploadPieceJointe.single('fichier')(req, res, async (err) => {
    if (err) {
      const tropVolumineux = err.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({
        message: tropVolumineux ? 'Fichier trop volumineux (10 Mo maximum).' : (err.message || "Erreur lors de l'envoi du fichier.")
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé.' });
    }
    try {
      const url = await resoudreUrl(req.file);
      res.json({
        url,
        nom: req.file.originalname,
        type: req.file.mimetype,
        taille: req.file.size
      });
    } catch (erreurS3) {
      console.error('Échec du téléversement S3 :', erreurS3);
      res.status(502).json({ message: "Impossible d'enregistrer le fichier pour le moment." });
    }
  });
});

module.exports = router;
