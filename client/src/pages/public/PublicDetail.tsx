import { ArrowLeft, Heart, MapPin, MessageCircle, Star, Phone, ShoppingBag, CalendarDays } from 'lucide-react';
import { ShareButton } from '../../components/share/ShareButton';
import { MediaCarousel } from '../../components/media/MediaCarousel';
import { Button } from '../../components/primitives';
import type { MediaItem } from '../../components/media/MediaCarousel';

type Props = { title:string; subtitle:string; description:string; location:string; media:MediaItem[]; rating?:number; reviews?:number; price?:string; kind:string };

export function PublicDetail({title,subtitle,description,location,media,rating,reviews,price,kind}:Props){
  const actionLabel = kind==='Restaurant' ? 'Réserver' : kind==='Hôtel' ? 'Voir les chambres' : kind==='Boutique' ? 'Voir le catalogue' : kind==='Produit' ? 'Ajouter au panier' : 'Contacter';
  return <div className="public-detail-page">
    <div className="detail-topbar"><button className="back-action" onClick={()=>history.back()}><ArrowLeft size={17}/> Retour</button><div className="detail-actions"><button className="icon-text-action"><Heart size={17}/> Enregistrer</button><ShareButton title={title || 'Loka'} text={description || ''} className="icon-text-action" /></div></div>
    <div className="detail-grid">
      <div className="detail-main-media"><MediaCarousel items={media} aspectRatio="wide" showThumbnails viewerTitle={title} viewerDescription={description} viewerMeta={location}/></div>
      <aside className="detail-summary">
        <span className="detail-kind">{kind}</span><h2>{title}</h2><p className="detail-subtitle">{subtitle}</p>
        {rating!==undefined && <div className="detail-rating"><Star size={16} fill="currentColor"/> <strong>{rating.toFixed(1)}</strong> <span>({reviews} avis)</span></div>}
        {price && <div className="detail-price">{price}</div>}
        <div className="detail-location"><MapPin size={17}/><span>{location}<small>Voir sur la carte</small></span></div>
        <p className="detail-description">{description}</p>
        <div className="detail-primary-actions"><Button onClick={()=>kind==='Produit' ? window.location.assign('/panier') : undefined}>{actionLabel}</Button><Button variant="secondary"><MessageCircle size={17}/> Discuter</Button></div>
        <div className="detail-trust"><span><Phone size={15}/> Contact direct</span><span><ShoppingBag size={15}/> Parcours Loka</span></div>
      </aside>
    </div>
    <section className="detail-section"><div><span className="section-eyebrow">À propos</span><h3>Une expérience locale, avec les informations utiles au bon moment.</h3></div><p>Les informations affichées ici restent séparées des états métier : consulter cette page ne crée ni commande, ni réservation, ni paiement.</p></section>
    {kind==='Restaurant' && <section className="detail-module"><CalendarDays size={20}/><div><strong>Réservation</strong><p>Choisissez une date, une heure et le nombre de personnes. Les disponibilités réelles seront fournies par le restaurant.</p></div><Button variant="secondary">Choisir une date</Button></section>}
  </div>;
}
