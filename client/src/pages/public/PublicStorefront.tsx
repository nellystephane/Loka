import { useEffect, useState } from 'react';
import { StorefrontRenderer, StorefrontType } from '../../components/storefront/StorefrontRenderer';
import { getPublicStorefront, getPublicStorefrontBySpace } from '../../services/storefrontPublic';
import { trackEvent } from '../../services/analytics';
export function PublicStorefront({ type, slug, spaceId }: { type?: StorefrontType; slug?: string; spaceId?: string }) {
 const [data,setData]=useState<any>(null),[error,setError]=useState(''),[loading,setLoading]=useState(Boolean(slug||spaceId));
 useEffect(()=>{if(!slug&&!spaceId)return;const task=slug?getPublicStorefront(slug):getPublicStorefrontBySpace(type||'boutique',spaceId!);task.then(setData).catch(e=>setError(e instanceof Error?e.message:'Vitrine introuvable.')).finally(()=>setLoading(false))},[slug,spaceId,type]);
 useEffect(() => { if (data && !error && (data?.espace?._id || spaceId || slug)) { const id = String(data?.espace?._id || spaceId || slug || ''); const entity = data?.config?.espaceType || type || 'vente'; trackEvent('view', entity === 'restauration' || entity === 'restaurant' ? 'restaurant' : entity === 'hotel' ? 'hotel' : 'boutique', id, { title: data?.espace?.nom || data?.nom || '', storefront: true }); } }, [data, error, spaceId, slug, type]);
 if(loading)return <div className="commerce-empty"><span className="section-eyebrow">Vitrine publique</span><h3>Chargement…</h3></div>;
 if(error)return <div className="commerce-empty"><h3>{error}</h3><p>La vitrine n’a pas pu être chargée. Vérifiez le lien ou réessayez plus tard.</p><a className="button button-secondary" href="/">Retour à l’accueil</a></div>;
 const raw=data?.config?.espaceType||type||'vente'; const resolved=(raw==='vente'?'boutique':raw==='restauration'?'restaurant':raw==='hotel'?'hotel':'boutique') as StorefrontType;
 return <StorefrontRenderer type={resolved} templateId={data?.config?.template} data={data} adaptiveOnly={Boolean(data)} accent={data?.config?.accent || data?.espace?.couleurPrincipale || '#0A84FF'} />;
}
