const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  espaceType: { type: String, enum: ['vente', 'restauration', 'hotel', 'livraison', 'agence_livraison', 'presence'], required: true },
  espaceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 },
  template: { type: String, required: true, default: 'boutique_minimal' },
  accent: { type: String, default: '#0A84FF' },
  couleurSecondaire: { type: String, default: '#1C1C1E' },
  couleurFond: { type: String, default: '#FFFFFF' },
  mode: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  catalogueLayout: { type: String, enum: ['grid', 'list', 'magazine'], default: 'grid' },
  configuration: { type: mongoose.Schema.Types.Mixed, default: {} },
  version: { type: Number, default: 1 },
  publie: { type: Boolean, default: false },
  publieLe: { type: Date, default: null }
}, { timestamps: true });

schema.index({ proprietaire: 1, espaceType: 1, espaceId: 1 }, { unique: true });
schema.index({ espaceType: 1, espaceId: 1 });
module.exports = mongoose.model('StorefrontConfig', schema);
