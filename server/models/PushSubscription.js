const mongoose = require('mongoose');

// ─── Abonnement push navigateur (Web Push / VAPID) — section 11.1,
// priorité 8 : « pas de push ». Un même utilisateur peut avoir plusieurs
// abonnements (un par navigateur/appareil) : pas d'unicité sur
// l'utilisateur, seulement sur l'endpoint (propre à chaque
// navigateur/appareil/installation).
const pushSubscriptionSchema = new mongoose.Schema({
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true, unique: true },
  cles: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  }
}, { timestamps: true });

pushSubscriptionSchema.index({ utilisateur: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
