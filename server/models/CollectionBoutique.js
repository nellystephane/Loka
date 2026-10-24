const mongoose = require('mongoose');

const collectionBoutiqueSchema = new mongoose.Schema({
  boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true },
  nom: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  image: { type: String, default: '' },
  mode: { type: String, enum: ['manuel', 'automatique'], default: 'manuel' },
  regle: { type: mongoose.Schema.Types.Mixed, default: {} },
  produits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Produit' }],
  ordre: { type: Number, default: 0 },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

collectionBoutiqueSchema.index({ boutique: 1, ordre: 1 });
collectionBoutiqueSchema.index({ boutique: 1, nom: 1 });

module.exports = mongoose.model('CollectionBoutique', collectionBoutiqueSchema);
