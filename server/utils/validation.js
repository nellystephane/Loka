const chaine = (v, max = 255) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
const montant = (v) => Number.isFinite(Number(v)) && Number(v) > 0;
const objectId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ''));

const validerInitiationPaiement = (req, res, next) => {
  const c = req.body?.contexte;
  if (!c || !chaine(c.type, 40)) return res.status(400).json({ message: 'Contexte de paiement invalide.' });
  const types = ['offre', 'panier_boutique', 'panier_restaurant', 'panier_multi', 'reservation', 'reservation_restaurant', 'livraison'];
  if (!types.includes(c.type)) return res.status(400).json({ message: 'Type de paiement invalide.' });
  if (['offre', 'reservation', 'reservation_restaurant', 'livraison'].includes(c.type) && c.id && !objectId(c.id)) return res.status(400).json({ message: 'Identifiant de contexte invalide.' });
  next();
};

const validerPaiementPro = (req, res, next) => {
  const { type, espaceType, methode } = req.body || {};
  if (!chaine(type, 40) || !chaine(espaceType, 40) || !chaine(methode, 30)) {
    return res.status(400).json({ message: 'Type, espace et méthode de paiement sont obligatoires.' });
  }
  if (!/^(starter|pro|business|presence)_(mensuel|annuel)$/.test(type)) {
    return res.status(400).json({ message: 'Type d’abonnement invalide.' });
  }
  next();
};

const validerRemboursement = (req, res, next) => {
  const { transactionId, montant, motif } = req.body || {};
  if (!objectId(transactionId) || !montant(montant) || !chaine(motif, 500)) {
    return res.status(400).json({ message: 'Transaction, montant et motif valides sont obligatoires.' });
  }
  next();
};

const validerPayoutConfiguration = (req, res, next) => {
  const { payoutActif, methode, numero, pays, emailBeneficiaire } = req.body || {};
  if (payoutActif && (!chaine(methode, 30) || !chaine(numero, 40))) {
    return res.status(400).json({ message: 'Méthode et numéro sont obligatoires pour activer les versements.' });
  }
  if (pays !== undefined && !/^[a-z]{2}$/i.test(String(pays))) return res.status(400).json({ message: 'Code pays invalide.' });
  if (emailBeneficiaire && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(emailBeneficiaire))) return res.status(400).json({ message: 'Email bénéficiaire invalide.' });
  next();
};

module.exports = { validerInitiationPaiement, validerPaiementPro, validerRemboursement, validerPayoutConfiguration };
