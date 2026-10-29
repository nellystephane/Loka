export type ProduitPayload = {
  nom: string;
  description: string;
  categorie: string;
  categorieId?: string | null;
  prix: number;
  quantiteDisponible: number;
  photos?: string[];
  video?: string;
  variantes?: { nom: string; valeurs: string[] }[];
  attributs?: Record<string, string | string[]>;
  tags?: string[];
  collections?: string[];
  etat?: 'neuf' | 'occasion';
  marque?: string;
  modele?: string;
  livraisonPossible?: boolean;
};

import { API_BASE } from './apiConfig';
const authHeaders = (token: string) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

async function request(path: string, options: RequestInit, fallbackMessage: string) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || fallbackMessage);
  }
  return response.json();
}

export const getBoutiqueCategories = (token: string) => request('/api/catalogue-boutique/categories', { headers: { Authorization: `Bearer ${token}` } }, 'Impossible de charger les catégories.');
export const createBoutiqueCategory = (payload: { nom: string; description?: string }, token: string) => request('/api/catalogue-boutique/categories', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(payload) }, 'Impossible de créer la catégorie.');
export const getBoutiqueCollections = (token: string) => request('/api/catalogue-boutique/collections', { headers: { Authorization: `Bearer ${token}` } }, 'Impossible de charger les collections.');
export const createBoutiqueCollection = (payload: { nom: string; description?: string; produits?: string[]; mode?: 'manuel' | 'automatique' }, token: string) => request('/api/catalogue-boutique/collections', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(payload) }, 'Impossible de créer la collection.');
export const getProductSchemaSuggestions = (type: string, token: string) => request(`/api/catalogue-boutique/schema?type=${encodeURIComponent(type)}`, { headers: { Authorization: `Bearer ${token}` } }, 'Impossible de charger les champs suggérés.');
export const createProduct = (payload: ProduitPayload, token: string) => request('/api/produits', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(payload) }, 'Impossible de créer le produit.');
