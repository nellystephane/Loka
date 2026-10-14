const mongoose = require('mongoose');

// ─── Commande restaurant (Espace Restauration) ───
const commandeRestaurantSchema = new mongoose.Schema({

  reference: { type: String, unique: true, sparse: true, index: true },

  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // propriétaire du restaurant
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },

  articles: [{
    plat: { type: mongoose.Schema.Types.ObjectId, ref: 'Plat', required: true },
    nom: { type: String, required: true },
    prixUnitaire: { type: Number, required: true },
    quantite: { type: Number, required: true, min: 1 }
  }],

  montantTotal: { type: Number, required: true },

  sousTotal: { type: Number, default: 0, min: 0 },
  fraisLivraison: { type: Number, default: 0, min: 0 },
  priseEnChargeLivraison: { type: String, enum: ['client','vendeur','partage','gratuite'], default: 'client' },
  montantLivreur: { type: Number, default: 0, min: 0 },
  livraison: { type: mongoose.Schema.Types.ObjectId, ref: 'DemandeLivraison', default: null },

  modeService: {
    type: String,
    enum: ['sur_place', 'a_emporter', 'livraison'],
    default: 'a_emporter'
  },

  statut: {
    type: String,
    enum: ['en_attente', 'confirmée', 'en_préparation', 'prête', 'en_livraison', 'livrée', 'terminée', 'annulée'],
    default: 'en_attente'
  },

  transactionPaiement: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionPaiement', default: null },

  adresseLivraison: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapUrl: { type: String, trim: true, default: '' },
    formattedAddress: { type: String, trim: true, default: '' }
  },

  note: { type: String, trim: true, maxlength: 300, default: '' }

}, {
  timestamps: true
});

commandeRestaurantSchema.index({ client: 1 });
commandeRestaurantSchema.index({ vendeur: 1 });
commandeRestaurantSchema.index({ restaurant: 1, statut: 1 });

commandeRestaurantSchema.index({ transactionPaiement: 1 }, { unique: true, sparse: true });


commandeRestaurantSchema.pre('validate', function(next) {
  if (!this.reference) {
    this.reference = `CMD-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('CommandeRestaurant', commandeRestaurantSchema);
