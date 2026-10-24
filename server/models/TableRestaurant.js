const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'CategorieEmplacementRestaurant', required: true },
  reference: { type: String, required: true, trim: true, maxlength: 30 },
  statut: { type: String, enum: ['disponible', 'reservee', 'arrivee', 'occupee', 'liberee', 'indisponible'], default: 'disponible' },
  actif: { type: Boolean, default: true }
}, { timestamps: true });
schema.index({ restaurant: 1, reference: 1 }, { unique: true });
schema.index({ restaurant: 1, categorie: 1, statut: 1 });
module.exports = mongoose.model('TableRestaurant', schema);
