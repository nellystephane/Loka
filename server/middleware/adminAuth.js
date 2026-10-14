// ─── À chaîner systématiquement après `auth` (qui a déjà peuplé
// req.user). Ne fait qu'une chose : vérifier le rôle. Toute la logique de
// suspension de compte vit déjà dans `auth`, pas ici. ───
const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  }
  next();
};

module.exports = adminAuth;
