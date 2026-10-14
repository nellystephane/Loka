const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const uploadRoutes = require('./routes/uploadRoutes');
const connectDB = require('./config/db');
const { JWT_SECRET } = require('./config/jwt');
const { FEDAPAY_SECRET_KEY, FEDAPAY_WEBHOOK_SECRET, FEDAPAY_ENV } = require('./config/fedapay');
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const { creerNotification } = require('./utils/notifier');
const { marquerEnLigne, marquerHorsLigne, estEnLigne } = require('./utils/presence');


// ─── Routes ───
const userRoutes = require('./routes/userRoutes');
const annonceRoutes = require('./routes/annonceRoutes');
const avisRoutes = require('./routes/avisRoutes');
const paiementRoutes = require('./routes/paiementRoutes');
const boutiqueRoutes = require('./routes/boutiqueRoutes');
const produitRoutes = require('./routes/produitRoutes');
const commandeRoutes = require('./routes/commandeRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const platRoutes = require('./routes/platRoutes');
const commandeRestaurantRoutes = require('./routes/commandeRestaurantRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const chambreRoutes = require('./routes/chambreRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const livreurRoutes = require('./routes/livreurRoutes');
const demandeLivraisonRoutes = require('./routes/demandeLivraisonRoutes');
const evaluationLivreurRoutes = require('./routes/evaluationLivreurRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const offreRoutes = require('./routes/offreRoutes');
const offreLivraisonRoutes = require('./routes/offreLivraisonRoutes');
const paiementCommandeRoutes = require('./routes/paiementCommandeRoutes');
const litigeRoutes = require('./routes/litigeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pushRoutes = require('./routes/pushRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const eventRoutes = require('./routes/eventRoutes');
const storefrontRoutes = require('./routes/storefrontRoutes');
const agenceLivraisonRoutes = require('./routes/agenceLivraisonRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const missionLivraisonRoutes = require('./routes/missionLivraisonRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const remboursementRoutes = require('./routes/remboursementRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const restaurantReservationRoutes = require('./routes/restaurantReservationRoutes');
const presenceProfessionnelleRoutes = require('./routes/presenceProfessionnelleRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Dossier d'upload : créé automatiquement s'il n'existe pas ───
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Origines autorisées (CORS) ───
// Configurable via la variable d'environnement CORS_ORIGINS (liste séparée par
// des virgules) pour ne pas avoir à modifier le code si le domaine change.
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'https://nellystephane.github.io,http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Autorise aussi les requêtes sans origine (apps mobiles, curl, health checks)
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorisée par CORS.'));
    }
  },
  credentials: true
};

// ─── Limitation du débit sur les routes sensibles (anti brute-force) ───
const limiteurAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ─── Middleware ───
app.use(helmet({
  // L'app sert des photos uploadées consommées cross-origin par le front GitHub Pages
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors(corsOptions));

// ─── Webhook FedaPay : DOIT être déclaré avant express.json() global, car la
// vérification de signature FedaPay a besoin du corps brut (Buffer), jamais
// du JSON déjà parsé. ───
app.post(
  '/api/paiements-commande/webhook',
  express.raw({ type: 'application/json' }),
  require('./controllers/paiementCommandeController').webhookFedaPay
);

app.use(express.json());
app.use(mongoSanitize()); // neutralise les opérateurs Mongo ($gt, $ne...) injectés dans le body/query
app.use('/uploads', express.static(uploadsDir));

app.use('/api/users/login', limiteurAuth);
app.use('/api/users/register', limiteurAuth);
app.use('/api/users/password', limiteurAuth);

// ─── Routes ───
app.use('/api/users', userRoutes);
app.use('/api/annonces', annonceRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/boutiques', boutiqueRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/plats', platRoutes);
app.use('/api/commandes-restaurant', commandeRestaurantRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/chambres', chambreRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/livreurs', livreurRoutes);
app.use('/api/demandes-livraison', demandeLivraisonRoutes);
app.use('/api/evaluations-livreur', evaluationLivreurRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/offres', offreRoutes);
app.use('/api/offres-livraison', offreLivraisonRoutes);
app.use('/api/paiements-commande', paiementCommandeRoutes);
app.use('/api/litiges', litigeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', eventRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/agences-livraison', agenceLivraisonRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/missions-livraison', missionLivraisonRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/remboursements', remboursementRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/restaurants', restaurantReservationRoutes);
app.use('/api/presences-professionnelles', presenceProfessionnelleRoutes);

// ─── Route d'accueil ───
app.get('/api', (req, res) => {
  res.json({ message: 'API Loka opérationnelle 🚀' });
});

// ─── Healthcheck : utile pour le monitoring (Render, uptime checks...) ───
app.get('/api/health', (req, res) => {
  const dbConnecte = mongoose.connection.readyState === 1;
  res.status(dbConnecte ? 200 : 503).json({
    statut: dbConnecte ? 'ok' : 'degrade',
    base_de_donnees: dbConnecte ? 'connectee' : 'deconnectee'
  });
});

// ─── Serveur HTTP + Socket.io (chat en temps réel) ───
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions
});
app.set('io', io); // pour que les contrôleurs REST puissent aussi émettre (voir conversationController)

// ─── Authentification des sockets via le même JWT que les routes REST ───
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentification requise.'));
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('Utilisateur introuvable.'));
    socket.userId = user._id.toString();
    socket.userNomComplet = `${user.prenom} ${user.nom}`;
    next();
  } catch {
    next(new Error('Token invalide.'));
  }
});

// ─── Diffuse un changement de présence aux personnes qui partagent une
// conversation avec cet utilisateur (pas de broadcast global : inutile et
// plus coûteux que de cibler les seules personnes concernées). ───
const diffuserPresence = async (userId, enLigneVal) => {
  try {
    const conversations = await Conversation.find({ participants: userId }).select('participants');
    const autres = new Set();
    conversations.forEach((c) => c.participants.forEach((p) => {
      if (p.toString() !== userId) autres.add(p.toString());
    }));
    if (autres.size === 0) return;

    let dernierActivite = null;
    if (!enLigneVal) {
      dernierActivite = new Date();
      await User.findByIdAndUpdate(userId, { dernierActivite }).catch(() => {});
    }

    autres.forEach((id) => {
      io.to(`user:${id}`).emit('presence:maj', { userId, enLigne: enLigneVal, dernierActivite });
    });
  } catch (error) {
    console.error('Erreur diffusion présence :', error);
  }
};

io.on('connection', (socket) => {
  // Salle personnelle : permet de notifier l'utilisateur même hors d'une conversation ouverte
  socket.join(`user:${socket.userId}`);

  // ─── Présence : ce socket compte comme une connexion active pour cet
  // utilisateur. S'il en avait déjà une autre ouverte (autre onglet,
  // autre appareil), on ne redouble pas l'annonce "en ligne". ───
  const etaitDejaEnLigne = estEnLigne(socket.userId);
  marquerEnLigne(socket.userId, socket.id);
  if (!etaitDejaEnLigne) diffuserPresence(socket.userId, true);

  socket.on('conversation:rejoindre', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('conversation:quitter', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('message:envoyer', async ({ conversationId, contenu, pieceJointe }, callback) => {
    try {
      const texte = (contenu || '').trim();
      if (!texte && !pieceJointe?.url) return callback?.({ erreur: 'Message vide.' });

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.some((p) => p.toString() === socket.userId)) {
        return callback?.({ erreur: "Vous ne participez pas à cette conversation." });
      }

      const message = await Message.create({
        conversation: conversationId,
        expediteur: socket.userId,
        contenu: texte,
        pieceJointe: pieceJointe?.url ? pieceJointe : undefined
      });

      conversation.dernierMessage = texte || (pieceJointe ? `📎 ${pieceJointe.nom || 'Pièce jointe'}` : '');
      conversation.derniereActivite = new Date();
      await conversation.save();

      io.to(`conversation:${conversationId}`).emit('message:nouveau', message);
      // Notifie aussi l'autre personne même si elle n'a pas la conversation ouverte
      for (const p of conversation.participants) {
        if (p.toString() !== socket.userId) {
          io.to(`user:${p.toString()}`).emit('conversation:maj', conversation._id);
          await creerNotification(
            io,
            p,
            pieceJointe?.url ? 'piece_jointe' : 'nouveau_message',
            pieceJointe?.url ? `${socket.userNomComplet} vous a envoyé un fichier` : `Nouveau message de ${socket.userNomComplet}`,
            texte.length > 100 ? `${texte.slice(0, 100)}…` : (texte || pieceJointe?.nom || ''),
            `/messages/${conversationId}`
          );
        }
      }

      callback?.({ message });
    } catch (error) {
      callback?.({ erreur: 'Erreur serveur.' });
    }
  });

  socket.on('disconnect', () => {
    const vientDePasserHorsLigne = marquerHorsLigne(socket.userId, socket.id);
    if (vientDePasserHorsLigne) diffuserPresence(socket.userId, false);
  });
});


// ─── Filet de sécurité : libère les réservations de stock des offres et
// paiements en attente dont la fenêtre est dépassée, même si personne n'a
// rouvert la conversation entre-temps (l'expiration "paresseuse" des
// contrôleurs ne se déclenche qu'à la prochaine lecture/action). Tourne en
// tâche de fond, indépendamment des requêtes HTTP. ───
const balayerReservationsPerimees = async () => {
  try {
    const Offre = require('./models/Offre');
    const TransactionPaiement = require('./models/TransactionPaiement');
    const { libererArticles } = require('./utils/stock');

    const offresExpirees = await Offre.find({ statut: 'proposée', expireA: { $lt: new Date() } });
    for (const offre of offresExpirees) {
      if (offre.contexte.type === 'produit') {
        await libererArticles(offre.articles.map((a) => ({ produitId: a.produit, quantite: a.quantite })));
      }
      offre.statut = 'expirée';
      await offre.save();
      io.to(`conversation:${offre.conversation}`).emit('offre:maj', offre);
    }

    const transactionsExpirees = await TransactionPaiement.find({ statut: 'en_attente', expireA: { $lt: new Date() } });
    for (const transaction of transactionsExpirees) {
      const { traiterPaiementEchoue } = require('./controllers/paiementCommandeController');
      await traiterPaiementEchoue(transaction, io);
      transaction.statut = 'expiré';
      await transaction.save();
    }

    // ─── Propositions de livraison en attente dont la fenêtre est dépassée
    // sans réponse : aucun stock à libérer ici (contrairement aux offres de
    // commande), juste le passage à "expirée". ───
    const OffreLivraison = require('./models/OffreLivraison');
    const offresLivraisonExpirees = await OffreLivraison.find({
      statut: { $in: ['proposée', 'contre_proposée'] },
      expireA: { $lt: new Date() }
    });
    for (const offreLivraison of offresLivraisonExpirees) {
      offreLivraison.statut = 'expirée';
      await offreLivraison.save();
      io.to(`conversation:${offreLivraison.conversation}`).emit('offreLivraison:maj', offreLivraison);
    }
  } catch (error) {
    console.error('Erreur lors du balayage des réservations périmées :', error.message);
  }
};
setInterval(balayerReservationsPerimees, 60 * 1000);

const startServer = async () => {
  try {
    await connectDB();

    if (process.env.NODE_ENV === 'production') {
      if (!FEDAPAY_SECRET_KEY) throw new Error('FEDAPAY_SECRET_KEY manquant en production.');
      if (!FEDAPAY_WEBHOOK_SECRET) throw new Error('FEDAPAY_WEBHOOK_SECRET manquant en production.');
      if (!process.env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID manquant en production.');
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error('Configuration SMTP incomplète en production.');
      if (!process.env.FRONTEND_URL) throw new Error('FRONTEND_URL manquant en production.');
    }

    console.log(`💳 FedaPay: ${FEDAPAY_SECRET_KEY ? `configuré (${FEDAPAY_ENV})` : 'non configuré'}`);
    console.log(`🔐 Webhook FedaPay: ${FEDAPAY_WEBHOOK_SECRET ? 'configuré' : 'non configuré'}`);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Démarrage impossible :', error.message);
    // En production, Render doit redémarrer l'instance plutôt que servir une
    // API partiellement fonctionnelle sans base de données/paiement.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // En développement seulement, laisser le serveur démarrer pour permettre
    // le travail sur les routes qui ne nécessitent pas encore MongoDB.
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('⚠ Serveur lancé en développement sans toutes les dépendances.');
    });
  }
};

startServer();