const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  transactionPaiement: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionPaiement', required: true },
  demandeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  montant: { type: Number, required: true, min: 1 },
  motif: { type: String, trim: true, maxlength: 500, required: true },
  statut: { type: String, enum: ['demande','en_cours','réussi','échoué','annulé'], default: 'demande' },
  referenceFedaPay: { type: String, default: null, index: true },
  referenceIdempotence: { type: String, unique: true, required: true },
  erreur: { type: String, trim: true, default: '' },
  traiteLe: { type: Date, default: null }
}, {timestamps:true});
schema.index({transactionPaiement:1,createdAt:-1});
module.exports=mongoose.model('Remboursement',schema);
