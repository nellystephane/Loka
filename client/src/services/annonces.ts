const API_BASE=(import.meta.env.VITE_API_URL as string|undefined)?.replace(/\/$/,'')||'';
export async function getAnnonce(id:string){const r=await fetch(`${API_BASE}/api/annonces/${encodeURIComponent(id)}`);const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.message||'Annonce introuvable.');return b;}
