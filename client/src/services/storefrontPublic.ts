const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
export async function getPublicStorefront(slug:string){ const r=await fetch(`${API_BASE}/api/storefront/public/${encodeURIComponent(slug)}/data`); const b=await r.json().catch(()=>({})); if(!r.ok) throw new Error(b.message||'Vitrine introuvable.'); return b; }

export async function getPublicStorefrontBySpace(type:string,id:string){ const r=await fetch(`${API_BASE}/api/storefront/public-space/${encodeURIComponent(type)}/${encodeURIComponent(id)}`); const b=await r.json().catch(()=>({})); if(!r.ok) throw new Error(b.message||'Vitrine introuvable.'); return b; }

export async function getStorefrontEditorData(espaceType:string,espaceId:string,token:string){ const r=await fetch(`${API_BASE}/api/storefront/editor-data?espaceType=${encodeURIComponent(espaceType)}&espaceId=${encodeURIComponent(espaceId)}`,{headers:{Authorization:`Bearer ${token}`}}); const b=await r.json().catch(()=>({})); if(!r.ok) throw new Error(b.message||'Impossible de charger la vitrine.'); return b; }
