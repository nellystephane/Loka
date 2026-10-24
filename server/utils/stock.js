const Produit = require('../models/Produit');

// ─── Stock à 3 états (section 6.1) : Disponible → Réservé → Vendu. La
// réservation temporaire doit être atomique côté backend : on utilise une
// mise à jour conditionnelle (findOneAndUpdate avec la condition dans le
// filtre) plutôt qu'un "lire puis écrire", pour éviter qu'une double
// négociation simultanée ne survende le même produit. ───

// Disponible → Réservé (une offre a été acceptée / une commande classique
// attend son paiement). Retourne true si la réservation a réussi.
const reserverStock = async (produitId, quantite) => {
  const resultat = await Produit.findOneAndUpdate(
    { _id: produitId, quantiteDisponible: { $gte: quantite } },
    { $inc: { quantiteDisponible: -quantite, quantiteReservee: quantite } }
  );
  return !!resultat;
};

// Réservé → Disponible (paiement refusé, échoué ou expiré, offre annulée).
const libererReservation = async (produitId, quantite) => {
  await Produit.findByIdAndUpdate(produitId, {
    $inc: { quantiteReservee: -quantite, quantiteDisponible: quantite }
  });
};

// Réservé → Vendu (paiement confirmé par le webhook FedaPay). Les unités
// réservées sortent définitivement du stock — jamais restituées.
const confirmerVente = async (produitId, quantite) => {
  await Produit.findByIdAndUpdate(produitId, { $inc: { quantiteReservee: -quantite } });
};

// ─── Réserve plusieurs lignes en une fois, avec retour en arrière (rollback)
// des lignes déjà réservées si l'une d'elles échoue — pour ne jamais rester
// avec une réservation partielle. articles: [{ produitId, quantite }] ───
const reserverArticles = async (articles) => {
  const reservees = [];
  for (const item of articles) {
    const ok = await reserverStock(item.produitId, item.quantite);
    if (!ok) {
      for (const r of reservees) await libererReservation(r.produitId, r.quantite);
      return { ok: false, produitEnEchec: item.produitId };
    }
    reservees.push(item);
  }
  return { ok: true };
};

const libererArticles = async (articles) => {
  for (const item of articles) {
    await libererReservation(item.produitId, item.quantite);
  }
};

const confirmerVenteArticles = async (articles) => {
  for (const item of articles) {
    await confirmerVente(item.produitId, item.quantite);
  }
};

module.exports = {
  reserverStock,
  libererReservation,
  confirmerVente,
  reserverArticles,
  libererArticles,
  confirmerVenteArticles
};
