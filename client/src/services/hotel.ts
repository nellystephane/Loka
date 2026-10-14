const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

async function request(path: string, options: RequestInit = {}, fallback = 'Impossible de communiquer avec Loka.') {
  const response = await fetch(`${API_BASE}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || fallback);
  return body;
}

const headers = (token: string) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

export const getHotelDashboard = (token: string, date?: string) => request(`/api/hotels/dashboard${date ? `?date=${encodeURIComponent(date)}` : ''}`, { headers: { Authorization: `Bearer ${token}` } }, 'Impossible de charger le tableau de bord hôtelier.');
export const updateHotel = (payload: Record<string, unknown>, token: string) => request('/api/hotels/moi', { method: 'PUT', headers: headers(token), body: JSON.stringify(payload) }, "Impossible de mettre à jour l'établissement.");
export const createHotelCategory = (payload: Record<string, unknown>, token: string) => request('/api/chambres', { method: 'POST', headers: headers(token), body: JSON.stringify(payload) }, 'Impossible de créer l’offre d’hébergement.');
export const updateHotelCategory = (id: string, payload: Record<string, unknown>, token: string) => request(`/api/chambres/${id}`, { method: 'PUT', headers: headers(token), body: JSON.stringify(payload) }, 'Impossible de modifier l’offre d’hébergement.');
export const createHotelUnit = (payload: Record<string, unknown>, token: string) => request('/api/unites-hebergement', { method: 'POST', headers: headers(token), body: JSON.stringify(payload) }, 'Impossible de créer l’unité.');
export const updateHotelUnit = (id: string, payload: Record<string, unknown>, token: string) => request(`/api/unites-hebergement/${id}`, { method: 'PUT', headers: headers(token), body: JSON.stringify(payload) }, 'Impossible de modifier l’unité.');
export const updateHotelReservationStatus = (id: string, statut: string, token: string) => request(`/api/reservations/${id}/statut`, { method: 'PUT', headers: headers(token), body: JSON.stringify({ statut }) }, 'Impossible de mettre à jour la réservation.');
