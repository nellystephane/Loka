const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  cibleType: { type: String, enum: ['boutique', 'restaurant', 'hotel', 'livreur', 'annonce', 'produit', 'plat', 'chambre'], required: true },
  cibleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  canal: { type: String, enum: ['whatsapp', 'facebook', 'instagram', 'tiktok', 'qr', 'copie', 'natif', 'autre'], required: true },
  sessionId: { type: String, default: null },
  referrer: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
});

schema.index({ cibleType: 1, cibleId: 1, canal: 1, createdAt: -1 });
module.exports = mongoose.model('Partage', schema);
