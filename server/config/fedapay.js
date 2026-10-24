// ─── Configuration FedaPay ───
// FEDAPAY_ENV : 'sandbox' (par défaut, sécurité par défaut) ou 'live'.
// FEDAPAY_SECRET_KEY : clé secrète du compte FedaPay (jamais exposée au front).
// FEDAPAY_WEBHOOK_SECRET : clé de signature de l'endpoint webhook, distincte
// par environnement (sandbox / live) — voir dashboard FedaPay > Webhooks.
const FEDAPAY_ENV = process.env.FEDAPAY_ENV === 'live' ? 'live' : 'sandbox';
const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY || '';
const FEDAPAY_WEBHOOK_SECRET = process.env.FEDAPAY_WEBHOOK_SECRET || '';
const FEDAPAY_CALLBACK_URL = process.env.FEDAPAY_CALLBACK_URL || '';

module.exports = { FEDAPAY_ENV, FEDAPAY_SECRET_KEY, FEDAPAY_WEBHOOK_SECRET, FEDAPAY_CALLBACK_URL };
