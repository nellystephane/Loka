const mongoose = require('mongoose');

// ─── Ledger (journal financier immuable) ───
// Règle transversale n°3 : « Le ledger est un journal immuable. Jamais un
// simple champ solde modifié. » Chaque événement financier crée une NOUVELLE
// entrée ; aucune entrée existante n'est jamais mise à jour (voir la garde
// pre-hook plus bas). Permet de reconstruire à tout moment pourquoi un
// bénéficiaire a exactement tel solde (section 8.3).
const ledgerSchema = new mongoose.Schema({

  transactionPaiement: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionPaiement', required: true },

  commande: {
    modele: { type: String, enum: ['Commande', 'CommandeRestaurant', 'CommandeAnnonce', 'Reservation', 'DemandeLivraison', 'ReservationRestaurant'], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true }
  },

  beneficiaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ─── Décomposition exigée par la section 8.3 : jamais un simple montant net. ───
  montantBrut: { type: Number, required: true },   // ce que le client a payé
  fraisPaiement: { type: Number, default: 0 },     // frais FedaPay du pay-in
  montantNet: { type: Number, required: true },    // ce qui revient au bénéficiaire
  fraisPayout: { type: Number, default: 0 },       // frais FedaPay du virement sortant (renseigné au payout)

  type: {
    type: String,
    enum: ['vente', 'remboursement', 'ajustement'],
    default: 'vente'
  },

  sens: {
    type: String,
    enum: ['credit', 'debit'],
    default: 'credit'
  },

  // ─── États de solde (section 8.4). Paiement confirmé ≠ argent disponible
  // ≠ argent versé : trois étapes distinctes et séquentielles. ───
  dateDisponibleA: { type: Date, default: null },

  soldeEtat: {
    type: String,
    enum: ['en_attente', 'disponible', 'verse', 'reserve', 'du_par_professionnel'],
    default: 'en_attente'
  },

  note: { type: String, trim: true, maxlength: 300, default: '' },

  // Une écriture de vente reste disponible tant qu'elle n'est pas réservée
  // par LedgerAllocation. soldeEtat est donc un état initial de lecture,
  // jamais modifié après création.
  origine: { type: String, trim: true, default: 'systeme' },
  idempotencyKey: { type: String, unique: true, sparse: true }

}, {
  timestamps: true
});

ledgerSchema.index({ beneficiaire: 1, soldeEtat: 1 });
ledgerSchema.index({ transactionPaiement: 1 });

// ─── Immuabilité : une entrée de ledger ne se corrige jamais, elle se
// contre-passe par une nouvelle entrée. On bloque toute tentative de
// modification d'une entrée existante. ───
const interdireModification = function (next) {
  next(new Error('Une entrée de ledger est immuable : créez une nouvelle entrée plutôt que de modifier celle-ci.'));
};
ledgerSchema.pre('updateOne', interdireModification);
ledgerSchema.pre('findOneAndUpdate', interdireModification);
ledgerSchema.pre('updateMany', interdireModification);
ledgerSchema.pre('replaceOne', interdireModification);
ledgerSchema.pre('deleteOne', interdireModification);
ledgerSchema.pre('deleteMany', interdireModification);

module.exports = mongoose.model('Ledger', ledgerSchema);
