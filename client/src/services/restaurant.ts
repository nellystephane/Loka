import { API_BASE } from './apiConfig';
const auth = (token: string) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });
async function request<T>(path: string, options: RequestInit = {}, fallback = 'Impossible de communiquer avec Loka.') {
  const r = await fetch(`${API_BASE}${path}`, options); const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.message || fallback); return b as T;
}
export const getRestaurantPublic = (id: string) => request<any>(`/api/restaurants/${encodeURIComponent(id)}`, {}, 'Restaurant introuvable.');
export const getReservationCategories = (id: string) => request<any[]>(`/api/restaurants/${encodeURIComponent(id)}/categories`, {}, 'Impossible de charger les catégories de réservation.');
export const createReservation = (payload: Record<string, unknown>, token: string) => request<any>('/api/restaurants/reservations', { method:'POST', headers:auth(token), body:JSON.stringify(payload) }, 'Impossible de créer la réservation.');
export const getMyRestaurantReservations = (token: string) => request<any[]>('/api/restaurants/reservations/miennes', { headers:{Authorization:`Bearer ${token}`} }, 'Impossible de charger vos réservations.');
