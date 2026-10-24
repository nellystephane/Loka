export type StorefrontSpaceType = 'vente' | 'restauration' | 'hotel' | 'livraison' | 'agence_livraison' | 'presence';

export type StorefrontConfigPayload = {
  espaceType: StorefrontSpaceType;
  espaceId: string;
  template: string;
  accent?: string;
  couleurSecondaire?: string;
  couleurFond?: string;
  mode?: 'light' | 'dark' | 'system';
  catalogueLayout?: 'grid' | 'list' | 'magazine';
  configuration?: Record<string, unknown>;
  publie?: boolean;
};

import { API_BASE } from './apiConfig';

export async function saveStorefront(payload: StorefrontConfigPayload, token: string) {
  const response = await fetch(`${API_BASE}/api/storefront`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Impossible d’enregistrer la vitrine.');
  }
  return response.json();
}

export async function getStorefrontTemplates(espaceType: StorefrontSpaceType, espaceId: string, token: string) {
  const params = new URLSearchParams({ espaceType, espaceId });
  const response = await fetch(`${API_BASE}/api/storefront/templates?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Impossible de charger les modèles.');
  return response.json();
}
