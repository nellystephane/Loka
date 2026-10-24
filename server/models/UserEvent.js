const mongoose = require('mongoose');

const TYPES = [
  'search', 'view', 'favorite', 'share', 'contact', 'cart', 'purchase',
  'reservation', 'delivery_request', 'completed', 'click', 'filter', 'template_preview'
];

const schema = new mongoose.Schema({
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  type: { type: String, enum: TYPES, required: true, index: true },
  cibleType: { type: String, trim: true, default: null },
  cibleId: { type: mongoose.Schema.Types.ObjectId, default: null },
  contexte: { type: mongoose.Schema.Types.Mixed, default: {} },
  sessionId: { type: String, trim: true, default: null, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

schema.index({ utilisateur: 1, type: 1, createdAt: -1 });
schema.index({ cibleType: 1, cibleId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('UserEvent', schema);
