// ─── Notifications push (Web Push / VAPID) — section 11.1, priorité 8.
// Comme email.js et stockageFichiers.js : no-op silencieux tant que les
// clés VAPID ne sont pas configurées, jamais bloquant pour l'appelant.
//
// Génération des clés (une seule fois, à stocker dans .env) :
//   npx web-push generate-vapid-keys
//
// ⚠️ web-push est déclaré dans package.json mais n'est pas installé dans
// cet environnement de développement — require paresseux, comme pour le
// S3 et l'email.

const estPushActif = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configure = false;
const configurerWebPush = () => {
  if (configure) return;
  // eslint-disable-next-line global-require
  const webpush = require('web-push');
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contact@loka.example',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  configure = true;
};

// ─── Envoie une notification push à TOUS les appareils abonnés d'un
// utilisateur (best-effort, en parallèle). Un abonnement expiré ou révoqué
// par le navigateur (statut 404/410) est supprimé silencieusement — c'est
// le signal standard Web Push qu'il ne sert plus à rien de réessayer. ───
const envoyerPush = async (utilisateurId, { titre, message, lien }) => {
  if (!estPushActif()) return;
  try {
    configurerWebPush();
    // eslint-disable-next-line global-require
    const webpush = require('web-push');
    const PushSubscription = require('../models/PushSubscription');

    const abonnements = await PushSubscription.find({ utilisateur: utilisateurId });
    if (abonnements.length === 0) return;

    const charge = JSON.stringify({ titre, message, lien: lien || '/' });

    await Promise.all(abonnements.map(async (abonnement) => {
      try {
        await webpush.sendNotification(
          { endpoint: abonnement.endpoint, keys: { p256dh: abonnement.cles.p256dh, auth: abonnement.cles.auth } },
          charge
        );
      } catch (erreur) {
        if (erreur.statusCode === 404 || erreur.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: abonnement._id });
        } else {
          console.error('Envoi push échoué :', erreur.message);
        }
      }
    }));
  } catch (erreur) {
    console.error('Erreur envoi push :', erreur.message);
  }
};

module.exports = { estPushActif, envoyerPush };
