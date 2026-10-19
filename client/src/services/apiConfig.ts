/** API publique de Loka. VITE_API_URL peut remplacer cette valeur lors du build. */
export const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) || 'https://proxiconnect.onrender.com').replace(/\/$/, '');
