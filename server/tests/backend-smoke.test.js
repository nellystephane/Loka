const test = require('node:test');
const assert = require('node:assert/strict');
const { GRILLE_PRO, prixPlan, palierDuPlan } = require('../utils/tarificationPro');
const { validerInitiationPaiement } = require('../utils/validation');

test('grille tarifaire Pro respecte les espaces métier', () => {
  assert.equal(prixPlan('vente', 'starter', 'mensuel'), 5000);
  assert.equal(prixPlan('restauration', 'pro', 'mensuel'), 10000);
  assert.equal(prixPlan('hotel', 'business', 'mensuel'), 50000);
  assert.equal(prixPlan('livreur_individuel', 'pro', 'mensuel'), 3000);
  assert.equal(prixPlan('presence', 'presence', 'mensuel'), 2500);
  assert.equal(prixPlan('hotel', 'starter', 'annuel'), 100000);
  assert.equal(palierDuPlan('business_annuel'), 'business');
});

test('validation paiement refuse un contexte inconnu', () => {
  let status = 200; let body;
  const req = { body: { contexte: { type: 'hack' } } };
  const res = { status(n) { status = n; return this; }, json(v) { body = v; } };
  validerInitiationPaiement(req, res, () => { status = 204; });
  assert.equal(status, 400);
  assert.match(body.message, /invalide/i);
});

console.log(`Grille testée: ${Object.keys(GRILLE_PRO).join(', ')}`);
