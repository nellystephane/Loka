const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  nom: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  zones: { type: [String], default: [] },
  telephone: { type: String, trim: true, default: '' },
  statut: { type: String, enum: ['active', 'suspendue'], default: 'active' },
  livreurs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  abonnementPro: {
    actif: { type: Boolean, default: false },
    plan: { type: String, enum: ['starter_mensuel', 'starter_annuel', 'pro_mensuel', 'pro_annuel', 'business_mensuel', 'business_annuel', null], default: null },
    dateFin: { type: Date, default: null },
    priorite: { type: Number, default: 0 }
  }
}, { timestamps: true });

schema.index({ zones: 1 });
module.exports = mongoose.model('AgenceLivraison', schema);
