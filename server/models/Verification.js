const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  demandeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  espaceType: { type: String, enum: ['vente', 'restauration', 'hotel', 'livraison', 'agence_livraison', 'presence'], required: true },
  espaceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  statut: { type: String, enum: ['non_verifie', 'en_attente', 'informations_requises', 'approuve', 'refuse', 'revoque'], default: 'en_attente' },
  typeVerification: { type: String, trim: true, default: 'standard' },
  preuves: [{ type: String, trim: true }],
  noteDemandeur: { type: String, trim: true, maxlength: 1000, default: '' },
  motifAdmin: { type: String, trim: true, maxlength: 1000, default: '' },
  traitePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  traiteLe: { type: Date, default: null }
}, { timestamps: true });

schema.index({ espaceType: 1, espaceId: 1, createdAt: -1 });
schema.index({ demandeur: 1, createdAt: -1 });

module.exports = mongoose.model('Verification', schema);
