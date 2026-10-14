// ─── E-mails transactionnels — section 11.1, priorité 8 : « pas d'emails
// transactionnels ». Comme pour le stockage S3 (utils/stockageFichiers.js),
// ce module ne fait RIEN par défaut : sans configuration SMTP dans .env,
// l'application continue de fonctionner exactement comme avant (l'email
// est simplement un best-effort silencieux qui ne bloque et ne casse
// jamais le flux appelant — un email raté ne doit jamais faire échouer un
// paiement, une suspension de compte, etc.).
//
// Variables attendues (voir .env.example) : SMTP_HOST, SMTP_PORT,
// SMTP_USER, SMTP_PASS, SMTP_FROM. Compatible avec n'importe quel
// fournisseur SMTP (Brevo/Sendinblue, Mailgun, SES, Gmail avec mot de
// passe d'application...) — pas de dépendance à un fournisseur en
// particulier.
//
// ⚠️ nodemailer est déclaré dans package.json mais n'est pas installé dans
// cet environnement de développement — require paresseux, comme pour le S3.

const estEmailActif = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporteur = null;
const obtenirTransporteur = () => {
  if (transporteur) return transporteur;
  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');
  transporteur = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporteur;
};

// ─── Envoie un email, silencieusement no-op si SMTP non configuré. Ne
// lève jamais d'exception vers l'appelant (règle : un email raté ne doit
// jamais interrompre l'action métier qui le déclenche). ───
const envoyerEmail = async ({ to, sujet, html, texte }) => {
  if (!estEmailActif() || !to) return false;
  try {
    await obtenirTransporteur().sendMail({
      from: process.env.SMTP_FROM || `Loka <${process.env.SMTP_USER}>`,
      to,
      subject: sujet,
      text: texte || html.replace(/<[^>]+>/g, ' '),
      html
    });
    return true;
  } catch (erreur) {
    console.error('Envoi email échoué :', erreur.message);
    return false;
  }
};

// ─── Petit gabarit HTML commun, pour ne pas répéter le même habillage à
// chaque appel — volontairement sobre (pas de tracking, pas d'image
// distante chargée par défaut). ───
const gabaritEmail = (titre, corpsHtml, lien) => `
  <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1c1c1e;">
    <p style="font-weight: 700; font-size: 16px; margin-bottom: 12px;">${titre}</p>
    <div style="font-size: 14px; line-height: 1.5; color: #3a3a3c;">${corpsHtml}</div>
    ${lien ? `<p style="margin-top: 20px;"><a href="${lien}" style="background:#007AFF;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">Voir sur Loka</a></p>` : ''}
    <p style="margin-top: 24px; font-size: 11px; color: #8e8e93;">Loka — vous recevez cet email suite à une action sur votre compte.</p>
  </div>
`;

module.exports = { estEmailActif, envoyerEmail, gabaritEmail };
