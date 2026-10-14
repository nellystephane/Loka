const mongoose = require('mongoose');

// ─── Commande née d'une annonce simple (Espace Annonces) ───
// Un particulier qui dépose une annonce doit suivre le même moteur
// commercial qu'un professionnel, sans être obligé d'ouvrir un espace pro
// (section 3.1/3.2). Objet distinct de Commande (boutique) et
// CommandeRestaurant : jamais fusionnés (section 2.3), mais rattaché par
// référence à l'Annonce et à l'Offre qui l'a produit.
const commandeAnnonceSchema = new mongoose.Schema({

  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // créateur de l'annonce
  annonce: { type: mongoose.Schema.Types.ObjectId, ref: 'Annonce', required: true },
  offre: { type: mongoose.Schema.Types.ObjectId, ref: 'Offre', default: null },

  titre: { type: String, required: true, trim: true }, // recopié au moment de la commande
  prixUnitaire: { type: Number, required: true }, // prix négocié, recopié
  quantite: { type: Number, required: true, min: 1, default: 1 },
  montantTotal: { type: Number, required: true },

  sousTotal: { type: Number, default: 0, min: 0 },
  fraisLivraison: { type: Number, default: 0, min: 0 },
  priseEnChargeLivraison: { type: String, enum: ['client','vendeur','partage','gratuite'], default: 'client' },
  montantLivreur: { type: Number, default: 0, min: 0 },
  livraison: { type: mongoose.Schema.Types.ObjectId, ref: 'DemandeLivraison', default: null },

  livraisonDemandee: { type: Boolean, default: false },
  adresseLivraison: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapUrl: { type: String, trim: true, default: '' },
    formattedAddress: { type: String, trim: true, default: '' }
  },

  statut: {
    type: String,
    enum: ['en_attente', 'confirmée', 'livrée', 'annulée'],
    default: 'en_attente'
  },

  transactionPaiement: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionPaiement', default: null },

  note: { type: String, trim: true, maxlength: 300, default: '' }

}, {
  timestamps: true
});

commandeAnnonceSchema.index({ client: 1 });
commandeAnnonceSchema.index({ vendeur: 1 });
commandeAnnonceSchema.index({ annonce: 1 });

module.exports = mongoose.model('CommandeAnnonce', commandeAnnonceSchema);
