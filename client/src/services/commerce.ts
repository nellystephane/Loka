export type CartItem = {
  id: string;
  type: 'boutique' | 'restaurant';
  produitId?: string;
  platId?: string;
  boutiqueId?: string;
  restaurantId?: string;
  name: string;
  seller: string;
  unitPrice: number;
  quantity: number;
  image?: string;
  variant?: string;
};

export type AdresseLivraison = {
  ville?: string;
  quartier?: string;
  details: string;
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string;
  formattedAddress?: string;
};

import { API_BASE } from './apiConfig';

async function request<T>(path: string, options: RequestInit, fallback: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || fallback);
  return body as T;
}

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem('loka-cart');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  window.localStorage.setItem('loka-cart', JSON.stringify(items));
}

export function addToCart(item: CartItem) {
  const items = readCart();
  const existing = items.find((entry) => entry.id === item.id && entry.variant === item.variant);
  if (existing) existing.quantity += item.quantity;
  else items.push({ ...item });
  writeCart(items);
  return items;
}

export function clearCart() {
  writeCart([]);
}

export type InitiatePaymentResponse = {
  lienPaiement: string;
  transactionId: string;
};

export type PaymentStatusResponse = {
  transaction: {
    id: string;
    montant: number;
    devise: string;
    statut: 'en_attente' | 'approuvé' | 'échoué' | 'remboursé' | 'expiré';
    contexte: { type: string; id?: string | null };
    createdAt: string;
  };
  commandes: Array<{
    id: string;
    reference: string;
    type: 'boutique' | 'restaurant';
    statut: string;
    nomEspace: string;
  }>;
};

export function initiatePayment(token: string, contexte: Record<string, unknown>) {
  return request<InitiatePaymentResponse>('/api/paiements-commande/initier', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ contexte }),
  }, 'Impossible d’initialiser le paiement.');
}

export function getPaymentStatus(token: string, transactionId: string) {
  return request<PaymentStatusResponse>(`/api/paiements-commande/${encodeURIComponent(transactionId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  }, 'Impossible de vérifier le paiement.');
}

export function getMyBoutiqueOrders(token: string) {
  return request<any[]>('/api/commandes/mes-achats', {
    headers: { Authorization: `Bearer ${token}` },
  }, 'Impossible de charger vos commandes boutique.');
}

export function getMyRestaurantOrders(token: string) {
  return request<any[]>('/api/commandes-restaurant/mes-achats', {
    headers: { Authorization: `Bearer ${token}` },
  }, 'Impossible de charger vos commandes restaurant.');
}

export function getBoutiqueProduct(productId: string) {
  return request<any>(`/api/produits/${encodeURIComponent(productId)}`, {}, 'Impossible de charger ce produit.');
}

export function getProductCatalog(params = '') {
  return request<{ produits: any[]; page: number }>(`/api/produits${params ? `?${params}` : ''}`, {}, 'Impossible de charger le catalogue.');
}
