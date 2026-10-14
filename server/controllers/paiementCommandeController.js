const TransactionPaiement = require('../models/TransactionPaiement');
const Paiement = require('../models/Paiement');
const Ledger = require('../models/Ledger');
const Offre = require('../models/Offre');
const OffreLivraison = require('../models/OffreLivraison');
const DemandeLivraison = require('../models/DemandeLivraison');
const Boutique = require('../models/Boutique');
const Restaurant = require('../models/Restaurant');
const Produit = require('../models/Produit');
const Plat = require('../models/Plat');
const { creerCheckoutFedaPay, construireEvenementWebhook } = require('../utils/fedapayClient');
const { creerNotification } = require('../utils/notifier');
const { libererArticles, confirmerVenteArticles, reserverArticles } = require('../utils/stock');
const { expirerSiNecessaire, finaliserOffrePayee } = require('./offreController');

// ─── Construit l'objet "customer" FedaPay à partir d'un utilisateur
// Loka, sans jamais transmettre de donnée sensible superflue. ───
const clientFedaPay = (user) => ({
  firstname: user.prenom,
  lastname: user.nom,
  email: user.email,
  ...(user.telephone ? { phone_number: { number: user.telephone, country: 'bj' } } : {})
});

const calculerPartLivraisonClient = ({ fraisLivraison=0, priseEnCharge='client', partClient=null }) => {
  const frais = Math.max(0, Number(fraisLivraison) || 0);
  if (priseEnCharge === 'gratuite' || priseEnCharge === 'vendeur') return 0;
  if (priseEnCharge === 'partage') return Math.min(frais, Math.max(0, Number(partClient ?? Math.ceil(frais/2)) || 0));
  return frais;
};

const creerDemandeLivraisonAutomatique = async ({ sourceType, commande, fraisLivraison, priseEnCharge, montantClient, montantLivreur, transactionPaiement }) => {
  if (!((sourceType==='vente' && commande.livraisonDemandee) || (sourceType==='restauration' && commande.modeService==='livraison'))) return null;
  const DemandeLivraison = require('../models/DemandeLivraison');
  const existante = await DemandeLivraison.findOne({sourceType,sourceId:commande._id});
  if (existante) return existante;
  const demande = await DemandeLivraison.create({ sourceType, sourceId:commande._id, sourceModel:sourceType==='vente'?'Commande':'CommandeRestaurant', vendeur:commande.vendeur, client:commande.client, adresseLivraison:commande.adresseLivraison||{}, tarif:Number(fraisLivraison)||0, montantClient:Number(montantClient)||0, montantLivreur:Number(montantLivreur)||0, montantVendeur:Math.max(0,(Number(fraisLivraison)||0)-(Number(montantClient)||0)), paiementTransaction:transactionPaiement||null, priseEnChargePar:priseEnCharge||'client', typeLivraison:'independante', statut:'en_attente', codeRecuperation:String(Math.floor(100000+Math.random()*900000)), codeLivraison:String(Math.floor(100000+Math.random()*900000)), historiqueStatuts:[{statut:'en_attente',par:commande.client,note:'Demande créée automatiquement avec la commande.'}] });
  commande.livraison=demande._id; await commande.save(); return demande;
};

// ─── Point d'entrée unique pour démarrer un paiement FedaPay, que ce soit
// pour une offre négociée dans le chat ou pour un panier boutique/restaurant
// classique. Le frontend ne fait jamais que demander un lien de paiement —
// il ne crée ni ne valide jamais la commande lui-même (règle transversale n°2). ───
// POST /api/paiements-commande/initier
const initierPaiement = async (req, res) => {
  try {
    const { contexte } = req.body;
    if (!contexte?.type) {
      return res.status(400).json({ message: 'Contexte de paiement manquant.' });
    }

    const payeur = req.user;
    let montant;
    let description;
    let contextePaiement;
    let donnees = null;

    if (contexte.type === 'offre') {
      let offre = await Offre.findById(contexte.id);
      if (!offre) return res.status(404).json({ message: 'Offre introuvable.' });
      if (offre.destinataire.toString() !== payeur._id.toString()) {
        return res.status(403).json({ message: 'Seul le destinataire de cette offre peut la payer.' });
      }
      const io = req.app.get('io');
      offre = await expirerSiNecessaire(offre, io);
      if (offre.statut !== 'proposée') {
        return res.status(409).json({ message: `Cette offre est ${offre.statut} et ne peut plus être payée.` });
      }
      montant = offre.montantTotal;
      description = `Loka — ${offre.contexte.titre}`;
      contextePaiement = { type: 'offre', id: offre._id };

    } else if (contexte.type === 'livraison') {
      const offreLivraison = await OffreLivraison.findById(contexte.id);
      if (!offreLivraison) return res.status(404).json({ message: 'Proposition de livraison introuvable.' });
      if (offreLivraison.statut !== 'acceptée' || offreLivraison.modePaiement !== 'loka') {
        return res.status(409).json({ message: 'Cette livraison n’est pas disponible pour un paiement Loka.' });
      }
      if (offreLivraison.expediteur.toString() !== payeur._id.toString()) {
        return res.status(403).json({ message: 'Seul le demandeur de la livraison peut effectuer le paiement.' });
      }
      if (!offreLivraison.demandeLivraisonCreee) return res.status(409).json({ message: 'Demande de livraison introuvable.' });
      const demande = await DemandeLivraison.findById(offreLivraison.demandeLivraisonCreee);
      if (!demande) return res.status(404).json({ message: 'Demande de livraison introuvable.' });
      montant = Number(offreLivraison.contrePropositionPrix ?? offreLivraison.prixPropose);
      description = 'Loka — livraison';
      contextePaiement = { type: 'livraison', id: offreLivraison._id };
      donnees = { offreLivraisonId: offreLivraison._id, demandeLivraisonId: demande._id };

    } else if (contexte.type === 'panier_boutique') {
      const { boutiqueId, articles, livraisonDemandee, adresseLivraison, fraisLivraison=0, priseEnChargeLivraison='client', partClientLivraison=null } = contexte.panier || {};
      if (!boutiqueId || !Array.isArray(articles) || articles.length === 0) {
        return res.status(400).json({ message: 'Panier invalide.' });
      }
      const boutique = await Boutique.findById(boutiqueId);
      if (!boutique) return res.status(404).json({ message: 'Boutique introuvable.' });
      if (boutique.proprietaire.toString() === payeur._id.toString()) {
        return res.status(400).json({ message: 'Vous ne pouvez pas commander dans votre propre boutique.' });
      }

      const articlesValides = [];
      let montantTotal = 0;
      for (const item of articles) {
        const produit = await Produit.findById(item.produitId);
        if (!produit || produit.boutique.toString() !== boutiqueId) {
          return res.status(400).json({ message: 'Produit invalide dans le panier.' });
        }
        const quantite = Math.max(1, parseInt(item.quantite) || 1);
        if (produit.quantiteDisponible < quantite) {
          return res.status(409).json({ message: `Stock insuffisant pour "${produit.nom}" (${produit.quantiteDisponible} disponible(s)).` });
        }
        articlesValides.push({ produitId: produit._id, nom: produit.nom, prixUnitaire: produit.prix, quantite, varianteChoisie: item.varianteChoisie || '' });
        montantTotal += produit.prix * quantite;
      }

      let adresseFinale = {};
      if (livraisonDemandee) {
        const description2 = (adresseLivraison?.details || '').trim();
        if (!description2) return res.status(400).json({ message: 'Merci de décrire comment trouver votre lieu de livraison.' });
        adresseFinale = {
          ville: (adresseLivraison?.ville || '').trim(),
          quartier: (adresseLivraison?.quartier || '').trim(),
          details: description2,
          latitude: typeof adresseLivraison?.latitude === 'number' ? adresseLivraison.latitude : null,
          longitude: typeof adresseLivraison?.longitude === 'number' ? adresseLivraison.longitude : null,
          mapUrl: (adresseLivraison?.mapUrl || '').trim(),
          formattedAddress: (adresseLivraison?.formattedAddress || '').trim()
        };
      }

      // ─── Réservation atomique (Disponible → Réservé) AVANT de générer le
      // lien de paiement, exactement comme pour une offre de chat. ───
      const reservation = await reserverArticles(articlesValides.map((a) => ({ produitId: a.produitId, quantite: a.quantite })));
      if (!reservation.ok) {
        return res.status(409).json({ message: 'Stock insuffisant — une autre transaction vient de réserver ce produit.' });
      }

      const fraisClient = livraisonDemandee ? calculerPartLivraisonClient({fraisLivraison,priseEnCharge:priseEnChargeLivraison,partClient:partClientLivraison}) : 0;
      const montantVendeur = Math.max(0, montantTotal - (livraisonDemandee && ['vendeur','gratuite'].includes(priseEnChargeLivraison) ? Number(fraisLivraison)||0 : (livraisonDemandee && priseEnChargeLivraison==='partage' ? (Number(fraisLivraison)||0)-fraisClient : 0)));
      montant = montantTotal + fraisClient;
      description = `Loka — ${boutique.nom}`;
      contextePaiement = { type: 'panier_boutique', id: null };
      donnees = { boutiqueId, client: payeur._id, vendeur: boutique.proprietaire, articles: articlesValides, sousTotal:montantTotal, fraisLivraison:Number(fraisLivraison)||0, priseEnChargeLivraison, partClientLivraison:fraisClient, montantVendeur, montantLivreur:Number(fraisLivraison)||0, livraisonDemandee: !!livraisonDemandee, adresseLivraison: adresseFinale };

    } else if (contexte.type === 'panier_restaurant') {
      const { restaurantId, articles, modeService, adresseLivraison, fraisLivraison=0, priseEnChargeLivraison='client', partClientLivraison=null } = contexte.panier || {};
      if (!restaurantId || !Array.isArray(articles) || articles.length === 0) {
        return res.status(400).json({ message: 'Panier invalide.' });
      }
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable.' });
      if (restaurant.proprietaire.toString() === payeur._id.toString()) {
        return res.status(400).json({ message: 'Vous ne pouvez pas commander dans votre propre restaurant.' });
      }

      const articlesValides = [];
      let montantTotal = 0;
      for (const item of articles) {
        const plat = await Plat.findById(item.platId);
        if (!plat || plat.restaurant.toString() !== restaurantId || !plat.disponible) {
          return res.status(400).json({ message: 'Plat invalide ou indisponible.' });
        }
        const quantite = Math.max(1, parseInt(item.quantite) || 1);
        articlesValides.push({ plat: plat._id, nom: plat.nom, prixUnitaire: plat.prix, quantite });
        montantTotal += plat.prix * quantite;
      }

      let adresseFinale = {};
      if (modeService === 'livraison') {
        const description2 = (adresseLivraison?.details || '').trim();
        if (!description2) return res.status(400).json({ message: 'Merci de décrire comment trouver votre lieu de livraison.' });
        adresseFinale = { ...adresseLivraison, details: description2 };
      }

      const fraisClient = modeService === 'livraison' ? calculerPartLivraisonClient({fraisLivraison,priseEnCharge:priseEnChargeLivraison,partClient:partClientLivraison}) : 0;
      const montantVendeur = Math.max(0, montantTotal - (modeService==='livraison' && ['vendeur','gratuite'].includes(priseEnChargeLivraison) ? Number(fraisLivraison)||0 : (modeService==='livraison' && priseEnChargeLivraison==='partage' ? (Number(fraisLivraison)||0)-fraisClient : 0)));
      montant = montantTotal + fraisClient;
      description = `Loka — ${restaurant.nom}`;
      contextePaiement = { type: 'panier_restaurant', id: null };
      donnees = { restaurantId, client: payeur._id, vendeur: restaurant.proprietaire, articles: articlesValides, sousTotal:montantTotal, fraisLivraison:Number(fraisLivraison)||0, priseEnChargeLivraison, partClientLivraison:fraisClient, montantVendeur, montantLivreur:Number(fraisLivraison)||0, modeService: modeService || 'a_emporter', adresseLivraison: adresseFinale };

    } else if (contexte.type === 'panier_multi') {
      // ─── Panier multi-boutiques (section 6.3) : plusieurs groupes
      // (boutique ou restaurant), un seul paiement, découpé en
      // sous-commandes à la confirmation (traiterPaiementApprouve). ───
      const groupes = contexte.panier?.groupes;
      if (!Array.isArray(groupes) || groupes.length === 0) {
        return res.status(400).json({ message: 'Panier invalide.' });
      }

      const groupesValides = [];
      let montantTotalGeneral = 0;
      const tousArticlesProduit = [];

      for (const groupe of groupes) {
        if (groupe.type === 'boutique') {
          const { boutiqueId, articles, livraisonDemandee, adresseLivraison, fraisLivraison=0, priseEnChargeLivraison='client', partClientLivraison=null } = groupe;
          if (!boutiqueId || !Array.isArray(articles) || articles.length === 0) {
            return res.status(400).json({ message: 'Panier invalide.' });
          }
          const boutique = await Boutique.findById(boutiqueId);
          if (!boutique) return res.status(404).json({ message: 'Boutique introuvable.' });
          if (boutique.proprietaire.toString() === payeur._id.toString()) {
            return res.status(400).json({ message: 'Vous ne pouvez pas commander dans votre propre boutique.' });
          }

          const articlesValides = [];
          let montantGroupe = 0;
          for (const item of articles) {
            const produit = await Produit.findById(item.produitId);
            if (!produit || produit.boutique.toString() !== boutiqueId) {
              return res.status(400).json({ message: 'Produit invalide dans le panier.' });
            }
            const quantite = Math.max(1, parseInt(item.quantite) || 1);
            if (produit.quantiteDisponible < quantite) {
              return res.status(409).json({ message: `Stock insuffisant pour "${produit.nom}" (${produit.quantiteDisponible} disponible(s)).` });
            }
            articlesValides.push({ produitId: produit._id, nom: produit.nom, prixUnitaire: produit.prix, quantite, varianteChoisie: item.varianteChoisie || '' });
            montantGroupe += produit.prix * quantite;
            tousArticlesProduit.push({ produitId: produit._id, quantite });
          }

          let adresseFinale = {};
          if (livraisonDemandee) {
            const description2 = (adresseLivraison?.details || '').trim();
            if (!description2) return res.status(400).json({ message: `Merci de décrire le lieu de livraison pour "${boutique.nom}".` });
            adresseFinale = {
              ville: (adresseLivraison?.ville || '').trim(),
              quartier: (adresseLivraison?.quartier || '').trim(),
              details: description2,
              latitude: typeof adresseLivraison?.latitude === 'number' ? adresseLivraison.latitude : null,
              longitude: typeof adresseLivraison?.longitude === 'number' ? adresseLivraison.longitude : null,
              mapUrl: (adresseLivraison?.mapUrl || '').trim(),
              formattedAddress: (adresseLivraison?.formattedAddress || '').trim()
            };
          }

          const fraisClient = livraisonDemandee ? calculerPartLivraisonClient({fraisLivraison,priseEnCharge:priseEnChargeLivraison,partClient:partClientLivraison}) : 0;
          const montantVendeur = Math.max(0, montantGroupe - (['vendeur','gratuite'].includes(priseEnChargeLivraison) ? Number(fraisLivraison)||0 : (priseEnChargeLivraison==='partage' ? (Number(fraisLivraison)||0)-fraisClient : 0)));
          groupesValides.push({ type:'boutique', boutiqueId, vendeur:boutique.proprietaire, articles:articlesValides, sousTotal:montantGroupe, fraisLivraison:Number(fraisLivraison)||0, priseEnChargeLivraison, partClientLivraison:fraisClient, montantVendeur, montantLivreur:Number(fraisLivraison)||0, montant:montantGroupe+fraisClient, livraisonDemandee:!!livraisonDemandee, adresseLivraison:adresseFinale });
          montantTotalGeneral += montantGroupe + fraisClient;

        } else if (groupe.type === 'restaurant') {
          const { restaurantId, articles, modeService, adresseLivraison, fraisLivraison=0, priseEnChargeLivraison='client', partClientLivraison=null } = groupe;
          if (!restaurantId || !Array.isArray(articles) || articles.length === 0) {
            return res.status(400).json({ message: 'Panier invalide.' });
          }
          const restaurant = await Restaurant.findById(restaurantId);
          if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable.' });
          if (restaurant.proprietaire.toString() === payeur._id.toString()) {
            return res.status(400).json({ message: 'Vous ne pouvez pas commander dans votre propre restaurant.' });
          }

          const articlesValides = [];
          let montantGroupe = 0;
          for (const item of articles) {
            const plat = await Plat.findById(item.platId);
            if (!plat || plat.restaurant.toString() !== restaurantId || !plat.disponible) {
              return res.status(400).json({ message: 'Plat invalide ou indisponible.' });
            }
            const quantite = Math.max(1, parseInt(item.quantite) || 1);
            articlesValides.push({ plat: plat._id, nom: plat.nom, prixUnitaire: plat.prix, quantite });
            montantGroupe += plat.prix * quantite;
          }

          let adresseFinale = {};
          if (modeService === 'livraison') {
            const description2 = (adresseLivraison?.details || '').trim();
            if (!description2) return res.status(400).json({ message: `Merci de décrire le lieu de livraison pour "${restaurant.nom}".` });
            adresseFinale = { ...adresseLivraison, details: description2 };
          }

          const fraisClient = modeService==='livraison' ? calculerPartLivraisonClient({fraisLivraison,priseEnCharge:priseEnChargeLivraison,partClient:partClientLivraison}) : 0;
          const montantVendeur = Math.max(0, montantGroupe - (['vendeur','gratuite'].includes(priseEnChargeLivraison) ? Number(fraisLivraison)||0 : (priseEnChargeLivraison==='partage' ? (Number(fraisLivraison)||0)-fraisClient : 0)));
          groupesValides.push({ type:'restaurant', restaurantId, vendeur:restaurant.proprietaire, articles:articlesValides, sousTotal:montantGroupe, fraisLivraison:Number(fraisLivraison)||0, priseEnChargeLivraison, partClientLivraison:fraisClient, montantVendeur, montantLivreur:Number(fraisLivraison)||0, montant:montantGroupe+fraisClient, modeService:modeService||'a_emporter', adresseLivraison:adresseFinale });
          montantTotalGeneral += montantGroupe + fraisClient;

        } else {
          return res.status(400).json({ message: 'Groupe de panier invalide.' });
        }
      }

      // ─── Réservation atomique de TOUS les articles produit, tous groupes
      // boutique confondus, avant de générer le lien de paiement — exactement
      // comme pour un panier mono-boutique. ───
      if (tousArticlesProduit.length > 0) {
        const reservation = await reserverArticles(tousArticlesProduit);
        if (!reservation.ok) {
          return res.status(409).json({ message: 'Stock insuffisant — une autre transaction vient de réserver un de ces produits.' });
        }
      }

      montant = montantTotalGeneral;
      description = `Loka — panier (${groupesValides.length} boutique(s)/restaurant(s))`;
      contextePaiement = { type: 'panier_multi', id: null };
      donnees = { client: payeur._id, groupes: groupesValides };

    } else {
      return res.status(400).json({ message: 'Type de contexte de paiement invalide.' });
    }

    const transaction = await TransactionPaiement.create({
      initiateur: payeur._id,
      contexte: contextePaiement,
      donnees,
      montant,
      devise: 'XOF'
    });

    let checkout;
    try {
      checkout = await creerCheckoutFedaPay({ montant, description, client: clientFedaPay(payeur) });
    } catch (erreurFedaPay) {
      // ─── Échec à l'initiation : on libère immédiatement toute réservation
      // faite pour ce panier, on ne laisse jamais du stock bloqué "pour rien". ───
      if (donnees?.articles && contextePaiement.type === 'panier_boutique') {
        await libererArticles(donnees.articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite })));
      } else if (donnees?.groupes && contextePaiement.type === 'panier_multi') {
        const tousArticlesProduit = donnees.groupes
          .filter((g) => g.type === 'boutique')
          .flatMap((g) => g.articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite })));
        if (tousArticlesProduit.length > 0) await libererArticles(tousArticlesProduit);
      }
      transaction.statut = 'échoué';
      await transaction.save();
      console.error(erreurFedaPay);
      return res.status(502).json({ message: "Impossible de contacter le service de paiement pour le moment. Réessayez dans un instant." });
    }

    transaction.referenceFedaPay = checkout.referenceFedaPay;
    transaction.lienPaiement = checkout.lienPaiement;
    transaction.expireA = new Date(Date.now() + 15 * 60 * 1000);
    await transaction.save();

    if (contexte.type === 'offre') {
      await Offre.findByIdAndUpdate(contexte.id, { transactionPaiement: transaction._id });
    }

    res.status(201).json({ lienPaiement: transaction.lienPaiement, transactionId: transaction._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── État d'un paiement pour son initiateur uniquement. Le frontend peut
// interroger cet état pour refléter le webhook réel, mais cette route ne
// transforme jamais elle-même un paiement en commande : le webhook reste la
// source de vérité. ───
const getPaymentStatus = async (req, res) => {
  try {
    const transaction = await TransactionPaiement.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction introuvable.' });
    if (transaction.initiateur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const [Commandes, CommandesRestaurant] = [require('../models/Commande'), require('../models/CommandeRestaurant')];
    const [boutiques, restaurants] = await Promise.all([
      Commandes.find({ client: req.user._id, transactionPaiement: transaction._id }).populate('boutique', 'nom'),
      CommandesRestaurant.find({ client: req.user._id, transactionPaiement: transaction._id }).populate('restaurant', 'nom')
    ]);

    res.json({
      transaction: {
        id: transaction._id,
        montant: transaction.montant,
        devise: transaction.devise,
        statut: transaction.statut,
        contexte: transaction.contexte,
        createdAt: transaction.createdAt
      },
      commandes: [
        ...boutiques.map((commande) => ({ id: commande._id, reference: commande.reference || String(commande._id), type: 'boutique', statut: commande.statut, nomEspace: commande.boutique?.nom || 'Boutique' })),
        ...restaurants.map((commande) => ({ id: commande._id, reference: commande.reference || String(commande._id), type: 'restaurant', statut: commande.statut, nomEspace: commande.restaurant?.nom || 'Restaurant' }))
      ]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Impossible de charger l’état du paiement.' });
  }
};

// ─── Crédite le ledger pour le(s) bénéficiaire(s) d'une transaction
// approuvée. Pas de commission Loka sur les ventes (section 8.7) :
// montantNet = montantBrut pour l'instant (les frais FedaPay réels, non
// exposés par l'API de paiement simple, restent à 0 tant que le rapprochement
// comptable n'est pas branché — voir 11.2, à affiner avec les relevés FedaPay). ───
const crediterLedger = async (transaction, beneficiaireId, montant, commandeModele, commandeId) => {
  const deja = await Ledger.findOne({ transactionPaiement: transaction._id, beneficiaire: beneficiaireId, 'commande.id': commandeId, type:'vente', idempotencyKey:`vente_${commandeModele}_${commandeId}_${beneficiaireId}` });
  if (deja) return deja;
  return creerEntree({ transactionPaiement: transaction._id, commande: { modele: commandeModele, id: commandeId }, beneficiaire: beneficiaireId, montantBrut: montant, fraisPaiement: transaction.fraisPaiement || 0, montantNet: Math.max(0, montant - (transaction.fraisPaiement || 0)), type:'vente', idempotencyKey:`vente_${commandeModele}_${commandeId}_${beneficiaireId}` });
};

// ─── Traite un paiement approuvé : concrétise la vente selon le contexte
// (offre de chat ou panier classique), crédite le ledger, notifie. Séparé du
// handler HTTP pour être appelé de façon identique par le webhook réel et,
// en secours, par une vérification manuelle de statut. ───
const traiterPaiementApprouve = async (transaction, io) => {
  if (transaction.statut === 'approuvé' && transaction.traitementMetier === 'termine') return;
  const maintenant = new Date();
  const ancien = new Date(Date.now() - 10 * 60 * 1000);
  const verrou = await TransactionPaiement.findOneAndUpdate(
    { _id: transaction._id, $or: [
      { traitementMetier: 'en_attente' },
      { traitementMetier: 'echec' },
      { traitementMetier: 'en_cours', traitementPrisLe: { $lt: ancien } }
    ] },
    { $set: { traitementMetier: 'en_cours', traitementPrisLe: maintenant } },
    { new: true }
  );
  if (!verrou) return;
  // Ne marquer approuvé qu'après la concrétisation métier. Si le processus
  // échoue, le webhook suivant pourra reprendre le traitement.


  if (transaction.contexte.type === 'offre') {
    const offre = await Offre.findById(transaction.contexte.id);
    if (!offre || offre.statut === 'payée') return;
    if (offre.contexte.type === 'produit') {
      await confirmerVenteArticles(offre.articles.map((a) => ({ produitId: a.produit, quantite: a.quantite })));
    }
    const { commande, modele } = await finaliserOffrePayee(offre);
    await crediterLedger(transaction, commande.vendeur, transaction.montant, modele, commande._id);

    if (io) io.to(`conversation:${offre.conversation}`).emit('offre:maj', offre);
    await creerNotification(io, commande.vendeur, 'nouvelle_commande', 'Nouvelle commande payée', `Commande de ${transaction.montant.toLocaleString('fr-FR')} XOF confirmée et payée via le chat.`, offre.contexte.type === 'annonce' ? '/annonces/mes-annonces' : (offre.contexte.type === 'plat' ? '/restauration' : '/vente'));
    await creerNotification(io, offre.destinataire, 'paiement_confirme', 'Paiement confirmé', `Votre paiement de ${transaction.montant.toLocaleString('fr-FR')} XOF a été confirmé.`, `/messages/${offre.conversation}`);

  } else if (transaction.contexte.type === 'livraison') {
    const demande = await DemandeLivraison.findById(transaction.donnees?.demandeLivraisonId);
    const offreLivraison = await OffreLivraison.findById(transaction.donnees?.offreLivraisonId);
    if (!demande || !offreLivraison) throw new Error('Livraison ou proposition introuvable pour ce paiement.');
    if (demande.paiementTransaction && demande.paiementTransaction.toString() !== transaction._id.toString()) {
      throw new Error('Cette livraison est déjà liée à un autre paiement.');
    }
    demande.paiementTransaction = transaction._id;
    demande.paiementStatut = 'payé';
    await demande.save();
    await creerNotification(io, demande.livreur || demande.client, 'paiement_livraison', 'Paiement de livraison confirmé', 'Le paiement de la course est confirmé.', '/livraison');
    await creerNotification(io, demande.client, 'paiement_confirme', 'Paiement confirmé', `Votre livraison de ${transaction.montant.toLocaleString('fr-FR')} XOF est payée.`, '/profil');
  } else if (transaction.contexte.type === 'panier_boutique') {
    const Commande = require('../models/Commande');
    const d = transaction.donnees;
    await confirmerVenteArticles(d.articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite })));
    const commande = await Commande.create({
      client: d.client,
      vendeur: d.vendeur,
      boutique: d.boutiqueId,
      articles: d.articles.map((a) => ({ produit: a.produitId, nom: a.nom, prixUnitaire: a.prixUnitaire, quantite: a.quantite, varianteChoisie: a.varianteChoisie })),
      montantTotal: transaction.montant,
      sousTotal:d.sousTotal ?? transaction.montant, fraisLivraison:d.fraisLivraison||0, priseEnChargeLivraison:d.priseEnChargeLivraison||'client', montantLivreur:d.montantLivreur||0,
      livraisonDemandee: d.livraisonDemandee,
      adresseLivraison: d.adresseLivraison,
      transactionPaiement: transaction._id,
      statut: 'confirmée'
    });
    await creerDemandeLivraisonAutomatique({sourceType:'vente',commande,fraisLivraison:d.fraisLivraison,priseEnCharge:d.priseEnChargeLivraison,montantClient:d.partClientLivraison,montantLivreur:d.montantLivreur,transactionPaiement:transaction._id});
    await crediterLedger(transaction, d.vendeur, d.montantVendeur ?? d.sousTotal ?? transaction.montant, 'Commande', commande._id);
    await creerNotification(io, d.vendeur, 'nouvelle_commande', 'Nouvelle commande', `Commande de ${transaction.montant.toLocaleString('fr-FR')} XOF payée sur votre boutique.`, '/vente');
    await creerNotification(io, d.client, 'paiement_confirme', 'Paiement confirmé', `Votre commande de ${transaction.montant.toLocaleString('fr-FR')} XOF est confirmée.`, '/profil');

  } else if (transaction.contexte.type === 'panier_restaurant') {
    const CommandeRestaurant = require('../models/CommandeRestaurant');
    const d = transaction.donnees;
    const commande = await CommandeRestaurant.create({
      client: d.client,
      vendeur: d.vendeur,
      restaurant: d.restaurantId,
      articles: d.articles,
      montantTotal: transaction.montant,
      sousTotal:d.sousTotal ?? transaction.montant, fraisLivraison:d.fraisLivraison||0, priseEnChargeLivraison:d.priseEnChargeLivraison||'client', montantLivreur:d.montantLivreur||0,
      modeService: d.modeService,
      adresseLivraison: d.adresseLivraison,
      transactionPaiement: transaction._id,
      statut: 'confirmée'
    });
    await creerDemandeLivraisonAutomatique({sourceType:'restauration',commande,fraisLivraison:d.fraisLivraison,priseEnCharge:d.priseEnChargeLivraison,montantClient:d.partClientLivraison,montantLivreur:d.montantLivreur,transactionPaiement:transaction._id});
    await crediterLedger(transaction, d.vendeur, d.montantVendeur ?? d.sousTotal ?? transaction.montant, 'CommandeRestaurant', commande._id);
    await creerNotification(io, d.vendeur, 'nouvelle_commande', 'Nouvelle commande', `Commande de ${transaction.montant.toLocaleString('fr-FR')} XOF payée sur votre restaurant.`, '/restauration');
    await creerNotification(io, d.client, 'paiement_confirme', 'Paiement confirmé', `Votre commande de ${transaction.montant.toLocaleString('fr-FR')} XOF est confirmée.`, '/profil');

  } else if (transaction.contexte.type === 'reservation_restaurant') {
    const ReservationRestaurant = require('../models/ReservationRestaurant');
    const TableRestaurant = require('../models/TableRestaurant');
    const reservation = await ReservationRestaurant.findById(transaction.contexte.id);
    if (!reservation) throw new Error('Réservation restaurant introuvable pour ce paiement.');
    if (reservation.transactionPaiement && reservation.transactionPaiement.toString() !== transaction._id.toString()) throw new Error('Réservation déjà liée à un autre paiement.');
    reservation.transactionPaiement = transaction._id;
    reservation.paiementStatut = 'approuve';
    reservation.statut = 'confirmee';
    reservation.expirePaiementA = null;
    reservation.ticketGenereLe = new Date();
    await reservation.save();
    if (reservation.table) await TableRestaurant.findByIdAndUpdate(reservation.table, { statut:'reservee' });
    const restaurant = await require('../models/Restaurant').findById(reservation.restaurant).select('proprietaire');
    if (!restaurant) throw new Error('Restaurant introuvable pour cette réservation.');
    await crediterLedger(transaction, restaurant.proprietaire, transaction.montant, 'ReservationRestaurant', reservation._id);
    await creerNotification(io, reservation.client, 'reservation_confirmee', 'Réservation restaurant confirmée', `Votre réservation ${reservation.reference} est confirmée.`, '/profil');
  } else if (transaction.contexte.type === 'reservation') {
    const Reservation = require('../models/Reservation');
    const reservation = await Reservation.findById(transaction.contexte.id);
    if (!reservation) throw new Error('Réservation introuvable pour ce paiement.');
    if (reservation.transactionPaiement && reservation.transactionPaiement.toString() !== transaction._id.toString()) throw new Error('Réservation déjà liée à un autre paiement.');
    if (reservation.statut !== 'en_attente_paiement') {
      // Idempotence : le webhook peut être reçu plusieurs fois. Une réservation
      // déjà confirmée ne doit pas recréditer le ledger ni refaire les notifications.
      if (reservation.paiementStatut === 'approuve' && ['confirmee', 'arrivee', 'en_sejour', 'terminee'].includes(reservation.statut)) {
        return;
      }
      throw new Error(`Réservation dans un état incompatible avec la confirmation du paiement : ${reservation.statut}.`);
    }

    reservation.transactionPaiement = transaction._id;
    reservation.paiementStatut = 'approuve';
    reservation.statut = 'confirmee';
    reservation.expirePaiementA = null;
    await reservation.save();
    await crediterLedger(transaction, reservation.hotelier, transaction.montant, 'Reservation', reservation._id);
    await creerNotification(io, reservation.hotelier, 'reservation_payee', 'Réservation payée', `Réservation de ${transaction.montant.toLocaleString('fr-FR')} XOF confirmée.`, '/hotel');
    await creerNotification(io, reservation.client, 'paiement_confirme', 'Réservation confirmée', 'Votre réservation est confirmée après paiement.', '/profil');
  } else if (transaction.contexte.type === 'panier_multi') {
    // ─── Panier multi-boutiques (section 6.3) : un seul paiement, découpé
    // ici en une sous-commande par bénéficiaire — exactement l'effet demandé
    // par le document ("le backend découpe ensuite en sous-commandes par
    // bénéficiaire"). Chaque sous-commande crédite son propre vendeur dans
    // le ledger, pour le montant de son seul groupe. ───
    const Commande = require('../models/Commande');
    const CommandeRestaurant = require('../models/CommandeRestaurant');
    const d = transaction.donnees;
    for (const groupe of d.groupes) {
      if (groupe.type === 'boutique') {
        await confirmerVenteArticles(groupe.articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite })));
        const commande = await Commande.create({
          client: d.client,
          vendeur: groupe.vendeur,
          boutique: groupe.boutiqueId,
          articles: groupe.articles.map((a) => ({ produit: a.produitId, nom: a.nom, prixUnitaire: a.prixUnitaire, quantite: a.quantite, varianteChoisie: a.varianteChoisie })),
          montantTotal: groupe.montant, sousTotal:groupe.sousTotal ?? groupe.montant, fraisLivraison:groupe.fraisLivraison||0, priseEnChargeLivraison:groupe.priseEnChargeLivraison||'client', montantLivreur:groupe.montantLivreur||0,
          livraisonDemandee: groupe.livraisonDemandee,
          adresseLivraison: groupe.adresseLivraison,
          transactionPaiement: transaction._id,
          statut: 'confirmée'
        });
        await creerDemandeLivraisonAutomatique({sourceType:'vente',commande,fraisLivraison:groupe.fraisLivraison,priseEnCharge:groupe.priseEnChargeLivraison,montantClient:groupe.partClientLivraison,montantLivreur:groupe.montantLivreur,transactionPaiement:transaction._id});
        await crediterLedger(transaction, groupe.vendeur, groupe.montantVendeur ?? groupe.sousTotal ?? groupe.montant, 'Commande', commande._id);
        await creerNotification(io, groupe.vendeur, 'nouvelle_commande', 'Nouvelle commande', `Commande de ${groupe.montant.toLocaleString('fr-FR')} XOF payée sur votre boutique.`, '/vente');
      } else if (groupe.type === 'restaurant') {
        const commande = await CommandeRestaurant.create({
          client: d.client,
          vendeur: groupe.vendeur,
          restaurant: groupe.restaurantId,
          articles: groupe.articles,
          montantTotal: groupe.montant, sousTotal:groupe.sousTotal ?? groupe.montant, fraisLivraison:groupe.fraisLivraison||0, priseEnChargeLivraison:groupe.priseEnChargeLivraison||'client', montantLivreur:groupe.montantLivreur||0,
          modeService: groupe.modeService,
          adresseLivraison: groupe.adresseLivraison,
          transactionPaiement: transaction._id,
          statut: 'confirmée'
        });
        await creerDemandeLivraisonAutomatique({sourceType:'restauration',commande,fraisLivraison:groupe.fraisLivraison,priseEnCharge:groupe.priseEnChargeLivraison,montantClient:groupe.partClientLivraison,montantLivreur:groupe.montantLivreur,transactionPaiement:transaction._id});
        await crediterLedger(transaction, groupe.vendeur, groupe.montantVendeur ?? groupe.sousTotal ?? groupe.montant, 'CommandeRestaurant', commande._id);
        await creerNotification(io, groupe.vendeur, 'nouvelle_commande', 'Nouvelle commande', `Commande de ${groupe.montant.toLocaleString('fr-FR')} XOF payée sur votre restaurant.`, '/restauration');
      }
    }
    await creerNotification(io, d.client, 'paiement_confirme', 'Paiement confirmé', `Votre panier de ${transaction.montant.toLocaleString('fr-FR')} XOF est confirmé (${d.groupes.length} commande(s) créée(s)).`, '/profil');
  }
  transaction.statut = 'approuvé';
  transaction.traitementMetier = 'termine';
  transaction.traitementPrisLe = null;
  await transaction.save();
};

// ─── Traite un paiement échoué/annulé : libère toute réservation de stock
// et notifie le payeur — jamais de commande créée (section 9 : "Paiement
// échoué → notification client, commande annulée, stock libéré"). ───
const traiterPaiementEchoue = async (transaction, io) => {
  if (['échoué', 'expiré'].includes(transaction.statut)) return;
  transaction.statut = 'échoué';
  await transaction.save();

  if (transaction.contexte.type === 'offre') {
    const offre = await Offre.findById(transaction.contexte.id);
    if (offre && offre.statut === 'proposée' && offre.contexte.type === 'produit') {
      await libererArticles(offre.articles.map((a) => ({ produitId: a.produit, quantite: a.quantite })));
    }
    if (offre) await creerNotification(io, offre.destinataire, 'paiement_echoue', 'Paiement échoué', "Votre paiement n'a pas abouti. Vous pouvez réessayer depuis la conversation.", `/messages/${offre.conversation}`);
  } else if (transaction.contexte.type === 'panier_boutique' && transaction.donnees) {
    await libererArticles(transaction.donnees.articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite })));
    await creerNotification(io, transaction.donnees.client, 'paiement_echoue', 'Paiement échoué', "Votre paiement n'a pas abouti. Le stock a été libéré.", '/annonces');
  } else if (transaction.contexte.type === 'panier_restaurant' && transaction.donnees) {
    await creerNotification(io, transaction.donnees.client, 'paiement_echoue', 'Paiement échoué', "Votre paiement n'a pas abouti.", '/restauration');
  } else if (transaction.contexte.type === 'reservation_restaurant') {
    const ReservationRestaurant = require('../models/ReservationRestaurant');
    const TableRestaurant = require('../models/TableRestaurant');
    const r = await ReservationRestaurant.findByIdAndUpdate(transaction.contexte.id, { $set:{ statut:'annulee', paiementStatut:'echoue' } }, {new:true});
    if (r?.table) await TableRestaurant.findByIdAndUpdate(r.table, { statut:'disponible' });
  } else if (transaction.contexte.type === 'reservation') {
    const Reservation = require('../models/Reservation');
    await Reservation.findByIdAndUpdate(transaction.contexte.id, { $set:{ statut:'annulée', paiementStatut:'échoué' } });

  } else if (transaction.contexte.type === 'panier_multi' && transaction.donnees) {
    const tousArticlesProduit = transaction.donnees.groupes
      .filter((g) => g.type === 'boutique')
      .flatMap((g) => g.articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite })));
    if (tousArticlesProduit.length > 0) await libererArticles(tousArticlesProduit);
    await creerNotification(io, transaction.donnees.client, 'paiement_echoue', 'Paiement échoué', "Votre paiement n'a pas abouti. Le stock a été libéré.", '/panier');
  }
};

// ─── Webhook FedaPay — seule source de vérité sur l'issue d'un paiement
// (règle transversale n°2). Monté AVANT le middleware express.json() global
// (voir index.js) : req.body est ici un Buffer brut, nécessaire à la
// vérification de signature. Idempotence obligatoire (section 8.6) : un
// double envoi ne doit jamais déclencher deux fois la création de commande. ───
// POST /api/paiements-commande/webhook
const webhookFedaPay = async (req, res) => {
  let evenement;
  try {
    evenement = construireEvenementWebhook(req.body, req.headers['x-fedapay-signature']);
  } catch (erreur) {
    console.error('Signature webhook FedaPay invalide :', erreur.message);
    return res.status(400).json({ message: 'Signature invalide.' });
  }

  try {
    const donneesTransaction = evenement?.data?.object || evenement?.data || {};
    const referenceFedaPay = String(donneesTransaction.id || donneesTransaction.transaction_id || '');
    if (!referenceFedaPay) return res.status(400).json({ message: 'Référence de transaction manquante.' });

    const transaction = await TransactionPaiement.findOne({ referenceFedaPay });
    if (!transaction) {
      const paiement = await Paiement.findOne({ referenceFedaPay });
      if (!paiement) return res.status(200).json({ received: true });
      const idEvenement = String(evenement.id || `${evenement.name}:${referenceFedaPay}`);
      if (paiement.evenementsTraites.includes(idEvenement)) return res.status(200).json({received:true,dejaTraite:true});
      paiement.evenementsTraites.push(idEvenement);
      if (evenement.name === 'transaction.approved') {
        paiement.statut = 'confirmé';
        if (paiement.espaceType) await require('./paiementController').activerAbonnementPro?.(paiement);
      } else if (['transaction.canceled','transaction.declined'].includes(evenement.name)) {
        paiement.statut = 'échoué';
      }
      await paiement.save();
      if (paiement.statut === 'confirmé' && paiement.espaceType) {
        const pc = require('./paiementController');
        await pc.activerAbonnementPro(paiement);
      }
      return res.status(200).json({received:true});
    }

    // ─── Idempotence : un événement déjà traité (identifié par son id
    // unique FedaPay) est ignoré silencieusement — jamais retraité. ───
    const idEvenement = String(evenement.id || `${evenement.name}:${referenceFedaPay}`);
    if (transaction.evenementsTraites.includes(idEvenement)) {
      return res.status(200).json({ received: true, dejaTraite: true });
    }
    const io = req.app.get('io');
    if (evenement.name === 'transaction.approved') {
      await traiterPaiementApprouve(transaction, io);
    } else if (['transaction.canceled', 'transaction.declined'].includes(evenement.name)) {
      await traiterPaiementEchoue(transaction, io);
    } else if (['transaction.refunded','transaction.partially_refunded','transaction.transferred_partially_refunded','transaction.transferred_refunded'].includes(evenement.name)) {
      // Pour un remboursement partiel, on ne doit jamais interpréter le
      // montant total de la transaction comme le montant remboursé. Si
      // FedaPay ne fournit pas le montant remboursé dans l'événement, on
      // accuse réception et on attend la confirmation administrative.
      let montantRembourse = Number(donneesTransaction.refunded_amount || donneesTransaction.amount_refunded || 0);
      if (!montantRembourse && evenement.name === 'transaction.refunded') montantRembourse = Number(transaction.montant || 0);
      const Remboursement = require('../models/Remboursement');
      const remboursements = montantRembourse > 0 ? await Remboursement.find({transactionPaiement:transaction._id,statut:{$in:['demande','en_cours']}}).sort({createdAt:1}) : [];
      const Ledger = require('../models/Ledger');
      const { creerEntree } = require('../utils/ledger');
      const credits = await Ledger.find({transactionPaiement:transaction._id,sens:'credit'}).sort({createdAt:1});
      let reste = montantRembourse;
      for (const r of remboursements) {
        if (reste<=0) break;
        const montant = Math.min(Number(r.montant), reste);
        let debitReste = montant;
        for (const credit of credits) {
          if (debitReste<=0) break;
          const deja = await Ledger.exists({idempotencyKey:`refund_${r._id}_${credit._id}`});
          if (deja) continue;
          const part = Math.min(debitReste, Number(credit.montantNet));
          if (part>0) {
            await creerEntree({transactionPaiement:transaction._id,commande:{modele:credit.commande.modele,id:credit.commande.id},beneficiaire:credit.beneficiaire,montantBrut:part,montantNet:part,type:'remboursement',sens:'debit',note:`Remboursement ${r._id}`,idempotencyKey:`refund_${r._id}_${credit._id}`});
            debitReste -= part;
          }
        }
        if (debitReste<=0) { r.statut='réussi'; r.referenceFedaPay=referenceFedaPay; r.traiteLe=new Date(); await r.save(); reste-=montant; await require('./remboursementController').finaliserRemboursementMetier?.(transaction); }
      }
      if (evenement.name === 'transaction.refunded' && montantRembourse >= Number(transaction.montant || 0)) transaction.statut='remboursé';
    }
    transaction.evenementsTraites.push(idEvenement);
    await transaction.save();
    // Autres événements (transaction.created, transaction.transferred, ...) : accusés sans action ici.

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(error);
    // Une erreur métier interne doit rester visible à FedaPay afin que
    // l'événement puisse être rejoué plutôt que considéré comme traité.
    res.status(500).json({ received: false, erreur: true });
  }
};

module.exports = { initierPaiement, getPaymentStatus, webhookFedaPay, traiterPaiementApprouve, traiterPaiementEchoue };
