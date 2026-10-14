const mongoose = require('mongoose');

// ─── Payout (versement à un vendeur ou un livreur) ───
// Ne remplace jamais le Ledger ni ne le modifie en masse (règle transversale
// n°3 : le ledger reste un journal immuable). Ce modèle ne fait que
// consigner l'ACTE de versement décidé par l'administration — un lot
// d'entrées de ledger "disponible" que l'on fait passer à "versé" une par
// une (voir adminController.creerPayout), avec ici la trace globale du
// virement (montant total, référence, qui l'a exécuté).
const payoutSchema = new mongoose.Schema({

  beneficiaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  entreesLedger: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ledger', required: true }],

  montant: { type: Number, required: true, min: 0 },
  reference: { type: String, trim: true, default: '' },

  executePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  statut: { type: String, enum: ['en_attente', 'en_cours', 'réussi', 'échoué', 'annulé'], default: 'en_attente' },
  methode: { type: String, enum: ['fedapay', 'manuel', 'autre'], default: 'fedapay' },
  fedaPayId: { type: String, default: null, index: true },
  fedaPayStatut: { type: String, default: null },
  idempotencyKey: { type: String, unique: true, sparse: true },
  frais: { type: Number, default: 0, min: 0 },
  referenceFournisseur: { type: String, trim: true, default: '' },
  erreur: { type: String, trim: true, default: '' },
  traiteLe: { type: Date, default: null },

}, { timestamps: true });

payoutSchema.index({ beneficiaire: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
