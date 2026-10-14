const mongoose = require('mongoose');

// Ce modèle représente l'offre / catégorie d'hébergement vendue au client.
// Les unités physiques sont gérées séparément dans UniteHebergement.
const TYPES_HEBERGEMENT = [
  'Simple',
  'Double',
  'Triple',
  'Suite',
  'Familiale',
  'Dortoir',
  'Studio',
  'Appartement',
  'Villa',
  'Autre'
];

const chambreSchema = new mongoose.Schema({

  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  createur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ─── Offre d'hébergement ───
  nom: { type: String, trim: true, maxlength: 100, default: '' },
  type: { type: String, required: true, trim: true },
  typeNormalise: { type: String, enum: TYPES_HEBERGEMENT, default: 'Autre' },
  description: { type: String, trim: true, maxlength: 2000, default: '' },

  prixParNuit: { type: Number, required: true, min: 0 },
  devise: { type: String, enum: ['XOF'], default: 'XOF' },
  capacite: { type: Number, required: true, min: 1, default: 2 },
  capaciteAdultes: { type: Number, min: 1, default: 2 },
  capaciteEnfants: { type: Number, min: 0, default: 0 },

  // Nombre d'unités physiques correspondant à cette offre.
  // Il permet déjà de gérer une capacité > 1 sans créer artificiellement des réservations par catégorie.
  nombreUnites: { type: Number, min: 1, default: 1 },

  // ─── Contenu ───
  photos: {
    type: [String],
    default: [],
    validate: [(val) => val.length <= 15, 'Maximum 15 photos autorisées']
  },
  equipements: { type: [String], default: [] },
  servicesInclus: { type: [String], default: [] },
  options: { type: [String], default: [] },

  // ─── Exploitation ───
  disponible: { type: Boolean, default: true },
  estMisEnAvant: { type: Boolean, default: false }

}, {
  timestamps: true
});

chambreSchema.index({ hotel: 1, disponible: 1 });
chambreSchema.index({ hotel: 1, typeNormalise: 1 });
chambreSchema.index({ hotel: 1, prixParNuit: 1 });

module.exports = mongoose.model('Chambre', chambreSchema);
module.exports.TYPES_CHAMBRE = TYPES_HEBERGEMENT;
module.exports.TYPES_HEBERGEMENT = TYPES_HEBERGEMENT;
