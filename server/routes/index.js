const express = require('express');
const connectDB = require('../config/db');

const userRoutes = require('./userRoutes');
const annonceRoutes = require('./annonceRoutes');
const avisRoutes = require('./avisRoutes');
const paiementRoutes = require('./paiementRoutes');
const paiementCommandeRoutes = require('./paiementCommandeRoutes');
const uploadRoutes = require('./uploadRoutes');
const boutiqueRoutes = require('./boutiqueRoutes');
const produitRoutes = require('./produitRoutes');
const catalogueBoutiqueRoutes = require('./catalogueBoutiqueRoutes');
const commandeRoutes = require('./commandeRoutes');
const restaurantRoutes = require('./restaurantRoutes');
const platRoutes = require('./platRoutes');
const commandeRestaurantRoutes = require('./commandeRestaurantRoutes');
const restaurantReservationRoutes = require('./restaurantReservationRoutes');
const hotelRoutes = require('./hotelRoutes');
const chambreRoutes = require('./chambreRoutes');
const uniteHebergementRoutes = require('./uniteHebergementRoutes');
const reservationRoutes = require('./reservationRoutes');
const livreurRoutes = require('./livreurRoutes');
const agenceLivraisonRoutes = require('./agenceLivraisonRoutes');
const demandeLivraisonRoutes = require('./demandeLivraisonRoutes');
const missionLivraisonRoutes = require('./missionLivraisonRoutes');
const offreLivraisonRoutes = require('./offreLivraisonRoutes');
const offreRoutes = require('./offreRoutes');
const conversationRoutes = require('./conversationRoutes');
const notificationRoutes = require('./notificationRoutes');
const pushRoutes = require('./pushRoutes');
const eventRoutes = require('./eventRoutes');
const evaluationLivreurRoutes = require('./evaluationLivreurRoutes');
const presenceProfessionnelleRoutes = require('./presenceProfessionnelleRoutes');
const storefrontRoutes = require('./storefrontRoutes');
const verificationRoutes = require('./verificationRoutes');
const remboursementRoutes = require('./remboursementRoutes');
const payoutRoutes = require('./payoutRoutes');
const financeRoutes = require('./financeRoutes');
const litigeRoutes = require('./litigeRoutes');
const discoveryRoutes = require('./discoveryRoutes');
const rechercheRoutes = require('./rechercheRoutes');
const adminRoutes = require('./adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public file uploads remain available for the existing upload workflow.
app.use('/uploads', express.static('uploads'));

// Identity / public content
app.use('/api/users', userRoutes);
app.use('/api/annonces', annonceRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/boutiques', boutiqueRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/catalogue-boutique', catalogueBoutiqueRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/plats', platRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/chambres', chambreRoutes);
app.use('/api/unites-hebergement', uniteHebergementRoutes);
app.use('/api/livreurs', livreurRoutes);
app.use('/api/agences-livraison', agenceLivraisonRoutes);

// Restaurant reservations share the /api/restaurants namespace with the
// restaurant public routes. Their paths are disjoint, e.g.:
// /api/restaurants/:restaurantId/categories
// /api/restaurants/reservations
app.use('/api/restaurants', restaurantReservationRoutes);

// Commerce / reservations
app.use('/api/commandes', commandeRoutes);
app.use('/api/commandes-restaurant', commandeRestaurantRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/paiements/commandes', paiementCommandeRoutes);
app.use('/api/remboursements', remboursementRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/finances', financeRoutes);

// Delivery
app.use('/api/demandes-livraison', demandeLivraisonRoutes);
app.use('/api/missions-livraison', missionLivraisonRoutes);
app.use('/api/offres-livraison', offreLivraisonRoutes);
app.use('/api/offres', offreRoutes);

// Communication / notifications / learning events
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/evenements', eventRoutes);
app.use('/api/evaluations-livreur', evaluationLivreurRoutes);

// Professional presence / storefront / verification
app.use('/api/presence-professionnelle', presenceProfessionnelleRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/verifications', verificationRoutes);

// Platform operations
app.use('/api/litiges', litigeRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/recherche', rechercheRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'API Loka opérationnelle 🚀' });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ DB error:', error.message);
    // Kept compatible with the current development workflow. Render/production
    // must still provide MONGODB_URI through its environment configuration.
    app.listen(PORT, '0.0.0.0', () => {
      console.log('⚠ Serveur lancé SANS DB');
    });
  }
};

startServer();

module.exports = app;
