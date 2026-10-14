const TransactionPaiement = require('../models/TransactionPaiement');
const Remboursement = require('../models/Remboursement');
const Ledger = require('../models/Ledger');
const { creerEntree } = require('../utils/ledger');
const { recupererTransactionFedaPay } = require('../utils/fedapayClient');
const Produit = require('../models/Produit');
const Commande = require('../models/Commande');
const CommandeRestaurant = require('../models/CommandeRestaurant');
const Offre = require('../models/Offre');

const montantRemboursements = async (transactionId) => {
  const agg = await Remboursement.aggregate([
    { $match: { transactionPaiement: transactionId, statut: { $in: ['demande', 'en_cours', 'réussi'] } } },
    { $group: { _id: null, total: { $sum: '$montant' } } }
  ]);
  return Number(agg[0]?.total || 0);
};

const demander = async (req, res) => {
  let transactionVerrouillee = null;
  try {
    const { transactionId, montant, motif } = req.body || {};
    const t = await TransactionPaiement.findById(transactionId);
    if (!t) return res.status(404).json({ message: 'Transaction introuvable.' });
    if (t.initiateur.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    if (!['approuvé'].includes(t.statut)) {
      return res.status(409).json({ message: 'Seul un paiement approuvé peut être remboursé.' });
    }

    // Serialize requests for a single transaction to prevent two concurrent
    // partial refunds from both passing the same remaining-balance check.
    const staleBefore = new Date(Date.now() - 2 * 60 * 1000);
    const verrou = await TransactionPaiement.findOneAndUpdate({
      _id: t._id,
      statut: 'approuvé',
      $or: [
        { remboursementEnCours: { $ne: true } },
        { remboursementVerrouilleLe: { $lt: staleBefore } },
      ],
    }, { $set: { remboursementEnCours: true, remboursementVerrouilleLe: new Date() } }, { new: true });
    if (!verrou) return res.status(409).json({ message: 'Une autre demande de remboursement est en cours sur ce paiement. Actualisez puis réessayez.' });
    transactionVerrouillee = verrou._id;

    const deja = await montantRemboursements(t._id);
    const m = Number(montant);
    if (!Number.isFinite(m) || m <= 0 || m + deja > t.montant) {
      return res.status(400).json({ message: 'Montant de remboursement invalide.' });
    }
    if (!String(motif || '').trim()) {
      return res.status(400).json({ message: 'Le motif du remboursement est obligatoire.' });
    }

    const r = await Remboursement.create({
      transactionPaiement: t._id,
      demandeur: req.user._id,
      montant: m,
      motif: String(motif).trim(),
      referenceIdempotence: `refund_${t._id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    });
    res.status(201).json(r);
  } catch (e) {
    res.status(400).json({ message: e.message });
  } finally {
    if (transactionVerrouillee) {
      try {
        await TransactionPaiement.updateOne({ _id: transactionVerrouillee, remboursementEnCours: true }, { $set: { remboursementEnCours: false, remboursementVerrouilleLe: null } });
      } catch (releaseError) {
        console.error('Impossible de libérer le verrou de remboursement:', releaseError.message);
      }
    }
  }
};

const verifierRemboursementExterne = async (transaction, referenceFedaPay) => {
  if (!referenceFedaPay || String(referenceFedaPay).trim() !== String(transaction.referenceFedaPay || '').trim()) {
    throw new Error('La référence FedaPay de la transaction originale est obligatoire pour confirmer le remboursement.');
  }
  const remote = await recupererTransactionFedaPay(transaction.referenceFedaPay);
  const statut = String(remote?.status || remote?.statut || '').toLowerCase();
  const statutsRembourses = new Set([
    'refunded',
    'partially_refunded',
    'transferred_refunded',
    'transferred_partially_refunded'
  ]);
  if (!statutsRembourses.has(statut)) {
    throw new Error(`FedaPay ne confirme pas encore le remboursement (statut distant: ${statut || 'inconnu'}).`);
  }
  return remote;
};

const creerDebitsRemboursement = async (r, t) => {
  const credits = await Ledger.find({ transactionPaiement: t._id, sens: 'credit' }).sort({ createdAt: 1 });
  if (!credits.length) {
    // Une course Loka payée avant la remise ne crée la créance du
    // livreur qu'au moment de la livraison. Si elle est remboursée avant
    // cette étape, aucun débit ledger n'est nécessaire.
    if (t.contexte?.type === 'livraison') return;
    throw new Error('Aucune écriture bénéficiaire trouvée pour cette transaction.');
  }

  const debitsExistants = await Ledger.aggregate([
    { $match: { transactionPaiement: t._id, sens: 'debit', type: 'remboursement' } },
    { $group: { _id: '$beneficiaire', total: { $sum: '$montantNet' } } }
  ]);
  const dejaParBeneficiaire = new Map(debitsExistants.map((d) => [String(d._id), Number(d.total || 0)]));

  let reste = Number(r.montant);
  for (const credit of credits) {
    if (reste <= 0) break;
    const deja = dejaParBeneficiaire.get(String(credit.beneficiaire)) || 0;
    const disponibleSurCredit = Math.max(0, Number(credit.montantNet) - deja);
    const montant = Math.min(reste, disponibleSurCredit);
    if (montant <= 0) continue;

    await creerEntree({
      transactionPaiement: t._id,
      commande: { modele: credit.commande.modele, id: credit.commande.id },
      beneficiaire: credit.beneficiaire,
      montantBrut: montant,
      montantNet: montant,
      fraisPaiement: 0,
      type: 'remboursement',
      sens: 'debit',
      note: `Remboursement ${r._id}`,
      idempotencyKey: `refund_${r._id}_${credit._id}`
    });
    reste -= montant;
    dejaParBeneficiaire.set(String(credit.beneficiaire), deja + montant);
  }
  if (reste > 0) throw new Error('Le remboursement dépasse le montant encore attribué aux bénéficiaires.');
};


const restaurerStockSiNecessaire = async (commande) => {
  if (!commande || commande.statut === 'livrée' || !Array.isArray(commande.articles)) return;
  for (const article of commande.articles) {
    if (article.produit) {
      await Produit.findByIdAndUpdate(article.produit, { $inc: { quantiteDisponible: Number(article.quantite || 0) } });
    }
  }
  commande.statut = 'annulée';
  await commande.save();
};

const finaliserRemboursementMetier = async (transaction) => {
  if (transaction.statut !== 'remboursé') return;
  const type = transaction.contexte?.type;
  if (type === 'panier_boutique') {
    const commande = await Commande.findOne({ transactionPaiement: transaction._id });
    await restaurerStockSiNecessaire(commande);
  } else if (type === 'panier_multi') {
    const [commandes, restaurants] = await Promise.all([
      Commande.find({ transactionPaiement: transaction._id }),
      CommandeRestaurant.find({ transactionPaiement: transaction._id })
    ]);
    for (const commande of commandes) await restaurerStockSiNecessaire(commande);
    for (const commande of restaurants) {
      if (commande.statut !== 'livrée') { commande.statut = 'annulée'; await commande.save(); }
    }
  } else if (type === 'offre') {
    const offre = await Offre.findById(transaction.contexte.id);
    if (offre?.contexte?.type === 'produit') {
      const commande = await Commande.findOne({ transactionPaiement: transaction._id });
      await restaurerStockSiNecessaire(commande);
    }
  } else if (type === 'reservation_restaurant') {
    const ReservationRestaurant = require('../models/ReservationRestaurant');
    const TableRestaurant = require('../models/TableRestaurant');
    const reservation = await ReservationRestaurant.findById(transaction.contexte.id);
    if (reservation) {
      reservation.statut = 'annulee';
      reservation.paiementStatut = 'rembourse';
      await reservation.save();
      if (reservation.table) await TableRestaurant.findByIdAndUpdate(reservation.table, { statut:'disponible' });
    }
  }
};
const traiter = async (req, res) => {
  try {
    const { statut, referenceFedaPay, erreur } = req.body || {};
    const r = await Remboursement.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Remboursement introuvable.' });
    if (!['en_cours', 'réussi', 'échoué', 'annulé'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    if (statut === 'réussi') {
      if (r.statut === 'réussi') return res.json(r);
      const t = await TransactionPaiement.findById(r.transactionPaiement);
      if (!t) return res.status(404).json({ message: 'Transaction introuvable.' });

      // FedaPay ne doit pas être déclaré remboursé par une simple saisie
      // administrative : on vérifie l'état distant avant de toucher au ledger.
      await verifierRemboursementExterne(t, referenceFedaPay);
      await creerDebitsRemboursement(r, t);

      r.statut = 'réussi';
      r.referenceFedaPay = String(referenceFedaPay).trim();
      r.traiteLe = new Date();
      await r.save();

      const cumul = await Remboursement.aggregate([
        { $match: { transactionPaiement: t._id, statut: 'réussi' } },
        { $group: { _id: null, total: { $sum: '$montant' } } }
      ]);
      const totalRembourse = Number(cumul[0]?.total || 0);
      t.statut = totalRembourse >= t.montant ? 'remboursé' : 'approuvé';
      await t.save();
      await finaliserRemboursementMetier(t);
      return res.json(r);
    }

    r.statut = statut;
    r.erreur = String(erreur || '').trim();
    if (['échoué', 'annulé'].includes(statut)) r.traiteLe = new Date();
    await r.save();
    res.json(r);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Traitement du remboursement impossible.' });
  }
};


const mesRemboursements = async (req, res) => {
  try {
    const items = await Remboursement.find({ demandeur: req.user._id })
      .populate('transactionPaiement', 'contexte montant devise statut createdAt')
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Impossible de charger vos demandes de remboursement.' });
  }
};

const transactionsRemboursables = async (req, res) => {
  try {
    const transactions = await TransactionPaiement.find({ initiateur: req.user._id, statut: 'approuvé' })
      .select('contexte montant devise statut createdAt referenceFedaPay')
      .sort({ createdAt: -1 }).limit(100).lean();
    if (!transactions.length) return res.json([]);
    const ids = transactions.map((transaction) => transaction._id);
    const totals = await Remboursement.aggregate([
      { $match: { transactionPaiement: { $in: ids }, statut: { $in: ['demande', 'en_cours', 'réussi'] } } },
      { $group: { _id: '$transactionPaiement', total: { $sum: '$montant' } } },
    ]);
    const refunded = new Map(totals.map((entry) => [String(entry._id), Number(entry.total || 0)]));
    res.json(transactions.map((transaction) => ({
      _id: transaction._id,
      contexte: transaction.contexte,
      montant: transaction.montant,
      devise: transaction.devise,
      statut: transaction.statut,
      createdAt: transaction.createdAt,
      montantDejaDemande: refunded.get(String(transaction._id)) || 0,
      montantRemboursable: Math.max(0, Number(transaction.montant || 0) - (refunded.get(String(transaction._id)) || 0)),
    })).filter((transaction) => transaction.montantRemboursable > 0));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Impossible de charger les paiements éligibles.' });
  }
};

module.exports = { demander, traiter, mesRemboursements, transactionsRemboursables, finaliserRemboursementMetier };
