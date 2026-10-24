const Notification = require('../models/Notification');
const { envoyerPush } = require('./push');
const { envoyerEmail, gabaritEmail } = require('./email');

// ─── Types de notification jugés assez importants pour justifier un email
// (argent, sécurité du compte) — pas les avis, messages ou évaluations, qui
// resteraient de simples notifications in-app/push pour ne pas noyer la
// boîte mail de l'utilisateur. Liste volontairement resserrée, à élargir
// au besoin plutôt que d'envoyer un email pour absolument tout. ───
const TYPES_AVEC_EMAIL = new Set([
  'paiement_confirme',
  'paiement_echoue',
  'nouvelle_commande',
  'compte_suspendu',
  'compte_reactive',
  'litige_traite',
  'payout_verse'
]);

// ─── Crée une notification en base et la pousse en temps réel si possible ───
// `io` peut être null (ex: contexte sans requête HTTP) : la notification est
// alors simplement stockée, l'utilisateur la verra à sa prochaine connexion.
//
// Best-effort supplémentaire (section 11.1, priorité 8) : push pour tous les
// types, email pour les types de TYPES_AVEC_EMAIL. Ni l'un ni l'autre ne
// peut faire échouer la création de la notification elle-même — chacun a
// son propre garde-fou (estPushActif/estEmailActif no-op si non configuré,
// et chaque envoi est best-effort côté push.js/email.js).
const creerNotification = async (io, destinataireId, type, titre, message, lien = '') => {
  try {
    const notification = await Notification.create({ destinataire: destinataireId, type, titre, message, lien });
    if (io) {
      io.to(`user:${destinataireId}`).emit('notification:nouvelle', notification);
    }

    // ─── Push : jamais attendu bloquant pour la réponse HTTP appelante (pas
    // de await ici volontairement), mais les erreurs internes sont déjà
    // toutes capturées dans push.js — un rejet ne remontera jamais ici. ───
    envoyerPush(destinataireId, { titre, message, lien });

    if (TYPES_AVEC_EMAIL.has(type)) {
      // ─── L'email a besoin de l'adresse du destinataire : un seul aller
      // simple en base, seulement pour les types qui en valent la peine. ───
      const User = require('../models/User');
      User.findById(destinataireId).select('email prenom').then((utilisateur) => {
        if (utilisateur?.email) {
          envoyerEmail({
            to: utilisateur.email,
            sujet: titre,
            html: gabaritEmail(titre, `<p>Bonjour ${utilisateur.prenom || ''},</p><p>${message}</p>`, lien ? `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}${lien}` : null)
          });
        }
      }).catch((erreur) => console.error('Email notification échoué :', erreur.message));
    }

    return notification;
  } catch (error) {
    // Une notification manquée ne doit jamais faire échouer l'action principale
    console.error('Erreur création notification:', error.message);
    return null;
  }
};

module.exports = { creerNotification };
