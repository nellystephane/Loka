import { useEffect, useState } from 'react';
import { StorefrontRenderer, StorefrontType } from '../../components/storefront/StorefrontRenderer';
import { getPublicStorefront, getPublicStorefrontBySpace } from '../../services/storefrontPublic';
export function PublicStorefront({ type, slug, spaceId }: { type?: StorefrontType; slug?: string; spaceId?: string }) {
 const [data,setData]=useState<any>(null),[error,setError]=useState(''),[loading,setLoading]=useState(Boolean(slug||spaceId));
 useEffect(()=>{if(!slug&&!spaceId)return;const task=slug?getPublicStorefront(slug):getPublicStorefrontBySpace(type||'boutique',spaceId!);task.then(setData).catch(e=>setError(e instanceof Error?e.message:'Vitrine introuvable.')).finally(()=>setLoading(false))},[slug,spaceId,type]);
 if(loading)return <div className="commerce-empty"><span className="section-eyebrow">Vitrine publique</span><h3>Chargement…</h3></div>;
 if(slug&&error)return <div className="commerce-empty"><h3>{error}</h3><a className="button button-secondary" href="/">Retour</a></div>;
 const raw=data?.config?.espaceType||type||'vente'; const resolved=(raw==='vente'?'boutique':raw==='restauration'?'restaurant':raw==='hotel'?'hotel':'boutique') as StorefrontType;
 return <StorefrontRenderer type={resolved} templateId={data?.config?.template} data={data} adaptiveOnly={Boolean(data)} accent={data?.config?.accent || data?.espace?.couleurPrincipale || '#0A84FF'} />;
}
