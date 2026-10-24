const mongoose = require('mongoose');

// ─── Offre (proposition de commande négociée dans le chat) ───
// Objet métier interactif rattaché à une Conversation (cf. doc de référence
// section 1.4 : « commerce conversationnel »). Une Offre matérialise l'étape
// « Convenir » du parcours Découvrir → Contacter → Échanger → Négocier →
// Convenir → Payer → Exécuter → Évaluer : elle transporte le produit/service,
// le prix négocié, la livraison éventuelle et le total, jusqu'au bouton
// Payer. Une fois acceptée, elle produit exactement le même objet Commande
// (ou équivalent) que le parcours panier → checkout classique — jamais deux
// moteurs séparés (règle transversale n°1).
const offreSchema = new mongoose.Schema({

  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },

  // ─── Qui propose / qui doit répondre ───
  expediteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destinataire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ─── D'où vient l'offre : un produit de boutique, un plat, ou une annonce
  // simple (vente ponctuelle/service d'un particulier). Correspond aux mêmes
  // trois portes d'entrée que le reste de la plateforme (section 2.1). ───
  contexte: {
    type: {
      type: String,
      enum: ['produit', 'plat', 'annonce'],
      required: true
    },
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    titre: { type: String, trim: true, default: '' }
  },

  // ─── Ligne(s) négociée(s). Pour une annonce, une seule ligne ; pour un
  // produit/plat, plusieurs lignes possibles si la négociation en couvre
  // plusieurs (le prix peut différer du prix catalogue : c'est tout le
  // principe de la négociation). ───
  articles: {
    type: [{
      // Pas de "ref" ici : la cible dépend de contexte.type (Produit ou Plat).
      // Le contrôleur résout/peuple la bonne collection lui-même.
      produit: { type: mongoose.Schema.Types.ObjectId, default: null },
      nom: { type: String, required: true, trim: true },
      prixUnitaire: { type: Number, required: true, min: 0 },
      quantite: { type: Number, required: true, min: 1, default: 1 },
      varianteChoisie: { type: String, default: '' }
    }],
    validate: [(val) => val.length > 0, "Une offre doit contenir au moins une ligne."]
  },

  montantTotal: { type: Number, required: true, min: 0 },

  livraisonDemandee: { type: Boolean, default: false },
  // ─── Double format toujours respecté (règle transversale n°13) : la
  // description humaine du lieu prime, le GPS reste optionnel. ───
  adresseLivraison: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapUrl: { type: String, trim: true, default: '' },
    formattedAddress: { type: String, trim: true, default: '' }
  },

  note: { type: String, trim: true, maxlength: 300, default: '' },

  statut: {
    type: String,
    enum: ['proposée', 'payée', 'refusée', 'annulée', 'expirée'],
    default: 'proposée'
  },

  // ─── Paiement FedaPay réglant cette offre, et fenêtre avant expiration
  // (le stock réservé — s'il y en a — doit être libéré automatiquement si
  // le paiement n'intervient pas dans ce délai, section 6.1). ───
  transactionPaiement: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionPaiement', default: null },
  expireA: { type: Date, default: null },

  // ─── Une fois acceptée, référence polymorphe vers l'objet Commande réel
  // créé (Commande / CommandeRestaurant / CommandeAnnonce selon la source).
  // L'Offre reste distincte de la Commande (jamais fusionnées) mais les
  // relie, comme l'exige la section 2.3. ───
  commandeCreee: {
    modele: { type: String, enum: ['Commande', 'CommandeRestaurant', 'CommandeAnnonce', null], default: null },
    id: { type: mongoose.Schema.Types.ObjectId, default: null }
  },

  // ─── Message système correspondant dans la conversation, pour que
  // l'historique du chat référence l'objet interactif. ───
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null }

}, {
  timestamps: true
});

offreSchema.index({ conversation: 1, createdAt: 1 });
offreSchema.index({ destinataire: 1, statut: 1 });
offreSchema.index({ expediteur: 1, statut: 1 });

module.exports = mongoose.model('Offre', offreSchema);
