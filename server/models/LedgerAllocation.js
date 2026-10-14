const mongoose = require('mongoose');

// Réservation technique d'une écriture de ledger pour un payout. Le ledger
// lui-même reste immuable : cette collection permet d'empêcher qu'une même
// écriture soit versée deux fois, même si deux admins déclenchent un payout
// presque simultanément.
const schema = new mongoose.Schema({
  ledger: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger', required: true, unique: true },
  payout: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout', required: true },
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

schema.index({ payout: 1 });
module.exports = mongoose.model('LedgerAllocation', schema);
