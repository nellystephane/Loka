import { API_BASE } from './apiConfig';
export async function getAnnonce(id:string){const r=await fetch(`${API_BASE}/api/annonces/${encodeURIComponent(id)}`);const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.message||'Annonce introuvable.');return b;}
