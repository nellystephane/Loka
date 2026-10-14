const mongoose = require('mongoose');

// ─── OffreLivraison (proposition de livraison négociée dans le chat) ───
// Objet métier interactif unifié pour tous les cas de la section 7.2 du
// document de référence : Client → Livreur, Boutique → Livreur,
// Restaurant → Livreur — y compris le cas « livreur via annonce simple »
// (section 3.7) qui n'a aucune commande derrière lui. Rattachée à une
// Conversation, exactement comme Offre (proposition de commande), et
// jamais fusionnée avec elle : ce sont deux objets métier distincts reliés
// par la même conversation (section 2.3).
//
// Convention (symétrique à Offre.js) : l'expéditeur est le demandeur
// (client, boutique ou restaurant) et le destinataire est le livreur
// sollicité — c'est lui qui accepte, refuse ou contre-propose (section 7.2 :
// « Le livreur accepte ou contre-propose »).
const offreLivraisonSchema = new mongoose.Schema({

  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },

  expediteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destinataire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ─── Référence de commande optionnelle (section 7.2 : « référence de
  // commande (si applicable) »). Absente pour une course directe négociée
  // depuis une annonce simple ou hors de tout achat Loka. ───
  commandeSource: {
    type: { type: String, enum: ['vente', 'restauration', null], default: null },
    id: { type: mongoose.Schema.Types.ObjectId, default: null }
  },

  // ─── Double format toujours respecté (règle transversale n°13) sur les
  // deux points de la course. ───
  pointDepart: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapUrl: { type: String, trim: true, default: '' }
  },
  destination: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapUrl: { type: String, trim: true, default: '' }
  },

  prixPropose: { type: Number, required: true, min: 0 },
  // ─── Contre-proposition éventuelle du livreur. Une seule à la fois : la
  // course est une négociation ponctuelle, pas un fil de négociation à
  // rallonge. ───
  contrePropositionPrix: { type: Number, default: null, min: 0 },

  details: { type: String, trim: true, maxlength: 300, default: '' },

  // ─── Paiement de la course (section 7.6). « a_la_livraison » reste tracé
  // comme paiement externe non vérifié — Loka ne prétend jamais
  // avoir traité ces fonds (règle transversale n°2). ───
  modePaiement: { type: String, enum: ['loka', 'a_la_livraison'], default: 'a_la_livraison' },

  statut: {
    type: String,
    enum: ['proposée', 'contre_proposée', 'acceptée', 'refusée', 'annulée', 'expirée'],
    default: 'proposée'
  },

  // ─── Une fois acceptée, référence vers la DemandeLivraison réelle créée —
  // même objet de suivi (statuts, historique) que le reste de la
  // plateforme. Jamais un second moteur de suivi séparé pour les courses
  // nées du chat (règle transversale n°1, appliquée par analogie). ───
  demandeLivraisonCreee: { type: mongoose.Schema.Types.ObjectId, ref: 'DemandeLivraison', default: null },

  // ─── Message système correspondant dans la conversation. ───
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },

  expireA: { type: Date, default: null }

}, {
  timestamps: true
});

offreLivraisonSchema.index({ conversation: 1, createdAt: 1 });
offreLivraisonSchema.index({ destinataire: 1, statut: 1 });
offreLivraisonSchema.index({ expediteur: 1, statut: 1 });

module.exports = mongoose.model('OffreLivraison', offreLivraisonSchema);
