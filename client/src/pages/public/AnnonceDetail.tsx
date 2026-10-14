import { useEffect, useState } from 'react';
import { getAppPath, withAppBasePath } from '../../utils/appBasePath';
import { ArrowLeft, MapPin, MessageCircle } from 'lucide-react';
import { createConversation } from '../../services/messages';
import { ShareButton } from '../../components/share/ShareButton';
import { getAnnonce } from '../../services/annonces';
import { Button } from '../../components/primitives';
import { trackEvent } from '../../services/analytics';

const money = (value: unknown) => Number(value || 0).toLocaleString('fr-FR');
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export function AnnonceDetail() {
  const id = getAppPath(window.location.pathname).split('/')[2] || '';
  const [annonce, setAnnonce] = useState<any>(null);
  const [error, setError] = useState('');
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    let active = true;
    getAnnonce(id).then((data) => { if (active) { setAnnonce(data); trackEvent('view', data.type === 'service' ? 'service' : 'annonce', String(data._id || id), { title: data.titre || data.nom || '', repeated: true }); } })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : 'Annonce indisponible.'); });
    return () => { active = false; };
  }, [id]);

  if (error) return <main className="commerce-empty"><h2>{error}</h2><a className="button button-secondary" href="/categories">Explorer les catégories</a></main>;
  if (!annonce) return <main className="commerce-empty" role="status"><span className="section-eyebrow">Contenu local</span><h2>Chargement…</h2></main>;

  const isService = annonce.type === 'service' || getAppPath(window.location.pathname).startsWith('/service/');
  const title = annonce.titre || annonce.nom || (isService ? 'Service local' : 'Annonce locale');
  const price = typeof annonce.prix === 'object' && annonce.prix !== null ? annonce.prix.montant : annonce.prix;
  const priceObject = typeof annonce.prix === 'object' && annonce.prix !== null ? annonce.prix : {};
  const location = [annonce.localisation?.details, annonce.localisation?.quartier, annonce.localisation?.ville, annonce.localisation?.pays]
    .map(text).filter(Boolean).join(', ') || text(annonce.ville) || 'Localisation non renseignée';
  const photos = (annonce.photos || annonce.images || []).filter((src: unknown) => typeof src === 'string' && src.trim());
  const owner = annonce.createur?._id || annonce.createur || annonce.vendeur?._id || annonce.vendeur || annonce.proprietaire?._id || annonce.proprietaire;
  const expiry = annonce.dateExpiration ? new Date(annonce.dateExpiration) : null;
  const expiryLabel = expiry && !Number.isNaN(expiry.getTime()) ? expiry.toLocaleDateString('fr-FR') : null;

  async function contact() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = withAppBasePath(`/connexion?next=${encodeURIComponent(window.location.pathname)}`); return; }
    if (!owner) { setError('Le contact du créateur n’est pas disponible pour cette annonce.'); return; }
    setContacting(true);
    trackEvent('contact', isService ? 'service' : 'annonce', String(annonce._id), { channel: 'messagerie' });
    try {
      const conversation = await createConversation(String(owner), { type: isService ? 'service' : 'annonce', id: annonce._id, titre: title }, token);
      window.location.href = withAppBasePath(`/messages?conversationId=${encodeURIComponent(conversation._id)}`);
    } catch {
      window.location.href = withAppBasePath(`/messages?destinataireId=${encodeURIComponent(String(owner))}&contextType=${isService ? 'service' : 'annonce'}&contextId=${encodeURIComponent(String(annonce._id))}&contextTitle=${encodeURIComponent(title)}`);
    } finally {
      setContacting(false);
    }
  }

  return <main className="public-detail-page">
    <button className="back-action" onClick={() => window.history.back()}><ArrowLeft size={17} /> Retour</button>
    <div className="detail-grid">
      <div className="detail-main-media">{photos.length ? <img className="public-detail-single-image" src={photos[0]} alt={title} /> : <div className="commerce-empty">Aucune photo disponible</div>}</div>
      <aside className="detail-summary">
        <span className="detail-kind">{isService ? 'Service local' : 'Annonce locale'}</span>
        <h2>{title}</h2>
        {annonce.categorie && <p className="detail-subtitle">{annonce.categorie}{annonce.sousCategorie ? ` · ${annonce.sousCategorie}` : ''}</p>}
        {priceObject.estGratuit ? <div className="detail-price">Gratuit</div> : price !== undefined && price !== null && <div className="detail-price">{money(price)} FCFA{priceObject.estNegociable ? ' · Négociable' : ''}</div>}
        <div className="detail-location"><MapPin size={17} /><span>{location}</span></div>
        <p className="detail-description">{annonce.description || ''}</p>
        {expiryLabel && <p className="detail-subtitle">Publication jusqu’au {expiryLabel}</p>}
        <div className="detail-primary-actions"><Button onClick={() => void contact()} disabled={contacting}><MessageCircle size={17} />{contacting ? 'Ouverture…' : 'Contacter'}</Button><ShareButton title={title} text={annonce.description || ''} cibleType="annonce" cibleId={annonce?._id ? String(annonce._id) : undefined} /></div>
      </aside>
    </div>
  </main>;
}
