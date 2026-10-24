const Ledger = require('../models/Ledger');
const LedgerAllocation = require('../models/LedgerAllocation');
const Payout = require('../models/Payout');

const creerEntree = async ({ transactionPaiement, commande, beneficiaire, montantBrut, fraisPaiement=0, montantNet, type='vente', sens='credit', note='', idempotencyKey=null }) => {
  if (!beneficiaire || !commande?.modele || !commande?.id) throw new Error('Bénéficiaire et référence métier obligatoires pour le ledger.');
  const delaiMinutes = Math.max(0, Number(process.env.FUNDS_AVAILABILITY_DELAY_MINUTES || 0));
  const dateDisponibleA = new Date(Date.now() + delaiMinutes * 60 * 1000);
  return Ledger.create({ transactionPaiement, commande, beneficiaire, montantBrut, fraisPaiement, montantNet: montantNet ?? montantBrut - fraisPaiement, type, sens, soldeEtat: sens === 'debit' ? 'du_par_professionnel' : 'en_attente', dateDisponibleA: sens === 'debit' ? null : dateDisponibleA, note, idempotencyKey });
};

const entreesDisponibles = async (beneficiaire) => {
  const dejaAllouees = await LedgerAllocation.distinct('ledger');
  return Ledger.find({ beneficiaire, sens:'credit', _id: { $nin: dejaAllouees }, $or:[{soldeEtat:'disponible'},{soldeEtat:'en_attente',dateDisponibleA:{$lte:new Date()}}] }).sort({ createdAt: 1 });
};

const creerPayoutEtReserver = async ({ beneficiaire, executePar, reference='' }) => {
  const entrees = await entreesDisponibles(beneficiaire);
  if (!entrees.length) return null;
  const montant = entrees.reduce((s,e)=>s+e.montantNet,0);
  const payout = await Payout.create({ beneficiaire, entreesLedger: entrees.map(e=>e._id), montant, reference, executePar, statut:'en_attente' });
  try {
    await LedgerAllocation.insertMany(entrees.map(e => ({ ledger:e._id, payout:payout._id, creePar:executePar })), { ordered:true });
  } catch (e) {
    await Payout.findByIdAndDelete(payout._id);
    if (e?.code === 11000) return creerPayoutEtReserver({ beneficiaire, executePar, reference });
    throw e;
  }
  return payout;
};

module.exports = { creerEntree, entreesDisponibles, creerPayoutEtReserver };
