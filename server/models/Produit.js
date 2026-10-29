const mongoose = require('mongoose');

const CATEGORIES_PRODUIT = [
  'Vêtements',
  'Électronique',
  'Alimentation',
  'Beauté & Hygiène',
  'Maison & Décoration',
  'Chaussures',
  'Accessoires',
  'Autre'
];

// ─── Produit (Espace Vente) ───
const produitSchema = new mongoose.Schema({

  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: true
  },
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  nom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  categorie: {
    type: String,
    required: true,
    trim: true
  },
  categorieId: { type: mongoose.Schema.Types.ObjectId, ref: 'CategorieBoutique', default: null },

  prix: {
    type: Number,
    required: true,
    min: 0
  },
  quantiteDisponible: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // ─── État "Réservé" (section 6.1) : unités bloquées par une offre acceptée
  // en attente de paiement, ou par une commande classique en attente de
  // paiement FedaPay. Ne fait pas partie du stock vendable tant que le
  // paiement n'est pas confirmé, mais n'est pas non plus définitivement
  // sorti du stock — elle revient à quantiteDisponible si le paiement
  // échoue, expire, ou si l'offre est refusée/annulée. ───
  quantiteReservee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  video: { type: String, default: '' },

  photos: {
    type: [String],
    validate: [(val) => val.length <= 10, 'Maximum 10 photos autorisées']
  },

  // ─── Variantes (taille, couleur, etc.) ───
  variantes: [{
    nom: { type: String, trim: true },
    valeurs: [{ type: String, trim: true }]
  }],

  // Attributs libres dépendants du type de produit : matière, garantie,
  // ingrédients, origine, volume, composition, entretien, etc.
  attributs: { type: mongoose.Schema.Types.Mixed, default: {} },
  tags: { type: [String], default: [] },
  collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CollectionBoutique' }],

  etat: {
    type: String,
    enum: ['neuf', 'occasion'],
    default: 'neuf'
  },
  marque: { type: String, trim: true, default: '' },
  modele: { type: String, trim: true, default: '' },
  livraisonPossible: {
    type: Boolean,
    default: true
  },

  estMisEnAvant: {
    type: Boolean,
    default: false
  },
  statut: {
    type: String,
    enum: ['disponible', 'rupture', 'archive'],
    default: 'disponible'
  },

  nombreVues: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

produitSchema.index({ boutique: 1, statut: 1 });
produitSchema.index({ categorie: 1 });
produitSchema.index({ nom: 'text', description: 'text' });

module.exports = mongoose.model('Produit', produitSchema);
module.exports.CATEGORIES_PRODUIT = CATEGORIES_PRODUIT;
