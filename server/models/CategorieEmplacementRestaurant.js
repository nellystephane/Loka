const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  nom: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  photos: { type: [String], default: [] },
  capaciteMin: { type: Number, default: 1, min: 1 },
  capaciteMax: { type: Number, required: true, min: 1 },
  nombreTables: { type: Number, default: 1, min: 1 },
  dureeMinutes: { type: Number, default: 120, min: 15 },
  fraisReservation: { type: Number, default: 0, min: 0 },
  modeFrais: { type: String, enum: ['non_deductible', 'deductible', 'acompte'], default: 'non_deductible' },
  actif: { type: Boolean, default: true }
}, { timestamps: true });
schema.index({ restaurant: 1, actif: 1 });
module.exports = mongoose.model('CategorieEmplacementRestaurant', schema);
