const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
let client = null;
const obtenirClient = () => {
  if (!CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID manquant.');
  if (!client) client = new OAuth2Client(CLIENT_ID);
  return client;
};
const verifierIdTokenGoogle = async (idToken) => {
  if (!idToken) throw new Error('Jeton Google manquant.');
  const ticket = await obtenirClient().verifyIdToken({ idToken, audience: CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) throw new Error('Compte Google non vérifié.');
  return payload;
};
module.exports = { verifierIdTokenGoogle };
