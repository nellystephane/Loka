const crypto = require('crypto');

// ─── Stockage des fichiers (photos, pièces jointes) — section 11.1,
// priorité 8 : « fichiers toujours stockés en local (pas de S3) ». ───
//
// Le stockage local (server/uploads, servi par express.static — voir
// index.js) reste le comportement PAR DÉFAUT et continue de fonctionner
// sans aucune configuration : c'est ce qui permet à ce projet de tourner
// en développement sans compte AWS. Dès que les variables S3_BUCKET,
// S3_REGION, S3_ACCESS_KEY_ID et S3_SECRET_ACCESS_KEY sont toutes
// renseignées (voir .env.example), le stockage bascule sur S3 (ou tout
// service compatible S3 — Cloudflare R2, Scaleway, MinIO... via
// S3_ENDPOINT) : utile en production, où le disque local d'une instance
// ne survit pas à un redéploiement.
//
// ⚠️ Le SDK (@aws-sdk/client-s3) est déclaré dans package.json mais n'est
// PAS installé dans cet environnement de développement (pas d'accès
// registre npm pour le vérifier ici) — `npm install` le récupérera
// normalement. Le require est fait paresseusement (à l'intérieur de la
// fonction) pour que le reste de l'application continue de fonctionner
// même si le module n'est pas encore installé et que le stockage S3 n'est
// pas configuré.

const estStockageS3Actif = () =>
  !!(process.env.S3_BUCKET && process.env.S3_REGION && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);

let clientS3 = null;
const obtenirClientS3 = () => {
  if (clientS3) return clientS3;
  // eslint-disable-next-line global-require
  const { S3Client } = require('@aws-sdk/client-s3');
  clientS3 = new S3Client({
    region: process.env.S3_REGION,
    // ─── S3_ENDPOINT : uniquement pour un service compatible S3 autre
    // qu'AWS (Cloudflare R2, Scaleway Object Storage, MinIO auto-hébergé...).
    // Absent → SDK AWS standard, région AWS classique. ───
    ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
  });
  return clientS3;
};

// ─── Téléverse un buffer déjà en mémoire (multer memoryStorage côté appelant
// quand le S3 est actif — voir uploadRoutes.js) et renvoie l'URL publique. ───
const televerserVersS3 = async (buffer, nomOriginal, mimetype) => {
  // eslint-disable-next-line global-require
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const extension = (nomOriginal.split('.').pop() || '').toLowerCase();
  const cle = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension ? `.${extension}` : ''}`;

  await obtenirClientS3().send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: cle,
    Body: buffer,
    ContentType: mimetype,
    // ─── Ni PIN, ni OTP, ni CVV, ni donnée sensible ne transite jamais par
    // ce chemin (uniquement des photos/pièces jointes déjà validées par
    // multer côté route) — cohérent avec la règle transversale du document
    // sur les données jamais stockées en clair. ───
  }));

  const urlPublique = process.env.S3_URL_PUBLIQUE_BASE
    ? `${process.env.S3_URL_PUBLIQUE_BASE.replace(/\/$/, '')}/${cle}`
    : `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${cle}`;

  return urlPublique;
};

module.exports = { estStockageS3Actif, televerserVersS3 };
