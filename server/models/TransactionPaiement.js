const mongoose = require('mongoose');

// ─── TransactionPaiement (pay-in FedaPay) ───
// Distinct du modèle Paiement (qui gère uniquement les abonnements — annonces
// et espaces Pro, cf. règle transversale n°7 : abonnement et argent des
// ventes sont deux flux séparés). Ce modèle couvre le paiement d'une
// transaction client ↔ professionnel/particulier (commande née du panier
// classique ou d'une offre négociée dans le chat) via FedaPay.
//
// ⚠️ Ne stocke jamais de donnée sensible (PIN, OTP, CVV, numéro de carte
// complet) — seuls la référence FedaPay, le montant et le statut le sont
// (section 8.6).
const transactionPaiementSchema = new mongoose.Schema({

  initiateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ─── Ce que ce paiement règle. "offre" référence une Offre déjà créée
  // (chat). "panier_boutique"/"panier_restaurant" (une seule boutique ou un
  // seul restaurant) et "panier_multi" (plusieurs boutiques/restaurants
  // combinés, section 6.3) n'ont pas encore d'objet Commande — celui-ci
  // n'est créé qu'à la confirmation du paiement (webhook) : "donnees" porte
  // alors l'instantané du panier nécessaire à sa construction (règle
  // transversale n°2 : le frontend ne décide jamais qu'un paiement a
  // réussi, donc la commande n'existe pas avant coup). ───
  contexte: {
    type: {
      type: String,
      enum: ['offre', 'panier_boutique', 'panier_restaurant', 'panier_multi', 'reservation', 'reservation_restaurant', 'livraison'],
      required: true
    },
    id: { type: mongoose.Schema.Types.ObjectId, default: null }
  },

  // ─── Instantané du panier (boutiqueId/restaurantId, articles avec
  // prix/quantité recopiés, livraison) — uniquement pour panier_boutique et
  // panier_restaurant. Absent pour une offre (déjà stockée sur l'Offre). ───
  donnees: { type: mongoose.Schema.Types.Mixed, default: null },

  montant: { type: Number, required: true, min: 0 },
  fraisPaiement: { type: Number, default: 0, min: 0 },
  beneficiaires: [{ utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, montant: { type: Number, min: 0 } }],
  devise: { type: String, default: 'XOF' },

  // ─── Référence FedaPay (identifiant de transaction côté FedaPay) —
  // jamais l'objet FedaPay complet, jamais de données de carte/mobile money. ───
  referenceFedaPay: { type: String, default: null, index: true },
  lienPaiement: { type: String, default: null },

  statut: {
    type: String,
    enum: ['en_attente', 'approuvé', 'échoué', 'remboursé', 'expiré'],
    default: 'en_attente'
  },

  // ─── Idempotence : identifiants des événements webhook déjà traités, pour
  // qu'un double envoi FedaPay ne déclenche jamais deux fois la création de
  // la commande ou le crédit du ledger (règle section 8.6). ───
  evenementsTraites: { type: [String], default: [] },

  expireA: { type: Date, default: null },

  // Verrou métier distinct du statut financier. Il empêche deux webhooks
  // simultanés de matérialiser deux fois une même commande. Un verrou ancien
  // peut être repris après expiration afin de ne pas bloquer une transaction
  // après un crash du serveur.
  traitementMetier: { type: String, enum: ['en_attente', 'en_cours', 'termine', 'echec'], default: 'en_attente' },
  traitementPrisLe: { type: Date, default: null }


}, {
  timestamps: true
});

transactionPaiementSchema.index({ initiateur: 1 });
transactionPaiementSchema.index({ 'contexte.type': 1, 'contexte.id': 1 });

module.exports = mongoose.model('TransactionPaiement', transactionPaiementSchema);
