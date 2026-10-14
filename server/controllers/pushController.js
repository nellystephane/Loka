const PushSubscription = require('../models/PushSubscription');
const { estPushActif } = require('../utils/push');

// GET /api/push/cle-publique
const clePublique = (req, res) => {
  res.json({ actif: estPushActif(), clePublique: estPushActif() ? process.env.VAPID_PUBLIC_KEY : null });
};

// ─── Enregistre (ou met à jour) l'abonnement push de l'appareil courant.
// upsert sur endpoint : un même navigateur qui se réabonne écrase ses
// propres clés plutôt que de dupliquer une ligne. ───
// POST /api/push/abonner
const abonner = async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Abonnement push invalide.' });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { utilisateur: req.user._id, endpoint, cles: { p256dh: keys.p256dh, auth: keys.auth } },
      { upsert: true, new: true }
    );
    res.status(201).json({ message: 'Abonnement enregistré.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/push/abonner
const desabonner = async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ message: 'Endpoint manquant.' });
    await PushSubscription.deleteOne({ endpoint, utilisateur: req.user._id });
    res.json({ message: 'Désabonnement effectué.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { clePublique, abonner, desabonner };
