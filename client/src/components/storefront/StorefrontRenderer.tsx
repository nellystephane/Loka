import { appPath } from '../../utils/navigation';
import { useState } from 'react';
import { ArrowRight, Clock3, MapPin, MessageCircle, Star } from 'lucide-react';
import { Button } from '../primitives';
import { MediaCarousel } from '../media/MediaCarousel';
import { BoutiqueEditorialTemplate } from './BoutiqueEditorialTemplate';
import { BoutiqueNeoFluxTemplate } from './BoutiqueNeoFluxTemplate';
import { BoutiqueOrbitGlassTemplate } from './BoutiqueOrbitGlassTemplate';
import { BoutiqueFloatFormTemplate } from './BoutiqueFloatFormTemplate';
import { BoutiquePopObjectTemplate } from './BoutiquePopObjectTemplate';
import { BoutiqueSpectrumIndexTemplate } from './BoutiqueSpectrumIndexTemplate';
import { BoutiquePrismVaultTemplate } from './BoutiquePrismVaultTemplate';
import { BoutiqueKineticAtelierTemplate } from './BoutiqueKineticAtelierTemplate';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';
import { RestaurantTempoTemplate } from './RestaurantTempoTemplate';
import { RestaurantEditorialDiningTemplate } from './RestaurantEditorialDiningTemplate';
import { createConversation } from '../../services/messages';
import { ShareButton } from '../share/ShareButton';

export type StorefrontType = 'boutique' | 'restaurant' | 'hotel';

export type StorefrontTemplate = {
  id: string;
  label: string;
  family: string;
  minimumPlan: 'starter' | 'pro' | 'business';
  description: string;
  layout: 'editorial' | 'catalogue' | 'experience' | 'premium' | 'minimal';
};

const templates: Record<StorefrontType, StorefrontTemplate[]> = {
  boutique: [
    { id: 'boutique_minimal', label: 'Minimal', family: 'Boutique', minimumPlan: 'starter', description: 'Lecture rapide, catalogue clair et parcours direct.', layout: 'minimal' },
    { id: 'boutique_catalogue', label: 'Catalogue', family: 'Boutique', minimumPlan: 'starter', description: 'Mettre les produits au premier plan.', layout: 'catalogue' },
    { id: 'boutique_editorial', label: 'Editorial', family: 'Boutique', minimumPlan: 'pro', description: 'Une vitrine plus narrative pour raconter la sélection.', layout: 'editorial' },
    { id: 'boutique_lifestyle', label: 'Lifestyle', family: 'Boutique', minimumPlan: 'pro', description: 'Images et collections avec une présentation plus immersive.', layout: 'experience' },
    { id: 'boutique_brand', label: 'Brand', family: 'Boutique', minimumPlan: 'business', description: 'Une présentation de marque plus complète.', layout: 'premium' },
    { id: 'boutique_immersive', label: 'Immersive', family: 'Boutique', minimumPlan: 'business', description: 'Grand média, contenu éditorial et collections.', layout: 'experience' },
    { id: 'boutique_pop_object', label: 'Pop Object', family: 'Boutique', minimumPlan: 'business', description: 'Le produit devient un objet graphique dans une composition de campagne.', layout: 'premium' },
    { id: 'boutique_spectrum_index', label: 'Spectrum Index', family: 'Boutique', minimumPlan: 'business', description: 'Un catalogue éditorial en index : couleurs franches, série numérotée et fiche produit immersive.', layout: 'premium' },
    { id: 'boutique_prism_vault', label: 'Prism Vault', family: 'Boutique', minimumPlan: 'business', description: 'Une vitrine architecturale aux volumes diagonaux, au contraste profond et aux produits mis en scène comme des objets.', layout: 'premium' },
    { id: 'boutique_kinetic_atelier', label: 'Kinetic Atelier', family: 'Boutique', minimumPlan: 'business', description: 'Une vitrine contemporaine construite autour de la typographie, du mouvement et d’une présentation séquencée des produits.', layout: 'experience' },
  ],
  restaurant: [
    { id: 'restaurant_bistro', label: 'Bistro', family: 'Restaurant', minimumPlan: 'starter', description: 'Menu et informations essentiels immédiatement visibles.', layout: 'minimal' },
    { id: 'restaurant_menu', label: 'Menu', family: 'Restaurant', minimumPlan: 'starter', description: 'Le menu devient le point central de la vitrine.', layout: 'catalogue' },
    { id: 'restaurant_gastronomie', label: 'Gastronomie', family: 'Restaurant', minimumPlan: 'pro', description: 'Images, histoire et menu avec une lecture éditoriale.', layout: 'editorial' },
    { id: 'restaurant_experience', label: 'Experience', family: 'Restaurant', minimumPlan: 'business', description: 'Une vitrine orientée expérience et réservation.', layout: 'experience' },
    { id: 'restaurant_tempo', label: 'Tempo', family: 'Restaurant', minimumPlan: 'pro', description: 'Menu, service et réservation dans une vitrine contemporaine animée.', layout: 'experience' },
    { id: 'restaurant_editorial_dining', label: 'Editorial Dining', family: 'Restaurant', minimumPlan: 'pro', description: 'Une vitrine éditoriale centrée sur la maison, le plat signature et une lecture fluide de la carte.', layout: 'editorial' },
  ],
  hotel: [
    { id: 'hotel_minimal', label: 'Minimal', family: 'Hôtel', minimumPlan: 'starter', description: 'Présentation simple des chambres et services.', layout: 'minimal' },
    { id: 'hotel_business', label: 'Business', family: 'Hôtel', minimumPlan: 'starter', description: 'Informations, disponibilité et réservation au premier plan.', layout: 'catalogue' },
    { id: 'hotel_boutique', label: 'Boutique', family: 'Hôtel', minimumPlan: 'pro', description: 'Galerie et identité de l’établissement.', layout: 'editorial' },
    { id: 'hotel_luxury', label: 'Luxury', family: 'Hôtel', minimumPlan: 'business', description: 'Une expérience visuelle plus riche pour l’établissement.', layout: 'premium' },
  ],
};

export function getStorefrontTemplates(type: StorefrontType) {
  return templates[type];
}

export function StorefrontRenderer({
  type,
  templateId = getStorefrontTemplates(type)[0].id,
  preview = false,
  accent = '#7C6A55',
  data,
  adaptiveOnly = false,
}: {
  type: StorefrontType;
  templateId?: string;
  preview?: boolean;
  accent?: string;
  data?: any;
  adaptiveOnly?: boolean;
}) {
  const source = data?.espace || data || null;
  const rawProducts = source?.produits || source?.plats || source?.hebergements || [];
  if (!source) return <div className="commerce-empty storefront-no-data"><span className="section-eyebrow">Vitrine</span><h3>Données professionnelles indisponibles</h3><p>La vitrine doit être ouverte depuis un espace professionnel réel.</p></div>;
  const item = {
    title: source.nom || 'Espace Loka',
    subtitle: source.slogan || source.description || '',
    description: source.description || source.histoire || '',
    location: [source.localisation?.adresse, source.localisation?.quartier, source.localisation?.ville, source.localisation?.pays].filter(Boolean).join(', ') || 'Localisation à compléter',
    rating: source.noteMoyenne || 0, reviews: source.nombreAvis || 0,
    media: (source.photos || [source.photoHero, source.banniere, source.logo].filter(Boolean)).map((src:string,i:number)=>({src,alt:`${source.nom || 'Espace'} — photo ${i+1}`})),
    products: rawProducts
  };
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const template = getStorefrontTemplates(type).find((entry) => entry.id === templateId) ?? getStorefrontTemplates(type)[0];
  const label = type === 'boutique' ? 'Boutique' : type === 'restaurant' ? 'Restaurant' : 'Hôtel';
  const isEditorial = template.layout === 'editorial';
  const isPremium = template.layout === 'premium' || template.layout === 'experience';
  const contactOwner = async () => {
    const token = localStorage.getItem('token'); const owner = source?.proprietaire?._id || source?.proprietaire;
    if (!token || !owner) { if (!token) window.location.href=appPath('/messages'); return; }
    try { const c = await createConversation(String(owner), { type, id: String(source?._id || ''), titre: source?.nom || '' }, token); window.location.href=appPath(`/messages?conversationId=${c._id}`); } catch { window.location.href=appPath(`/messages?destinataireId=${encodeURIComponent(String(owner))}&contextType=${type}&contextId=${encodeURIComponent(String(source?._id || ''))}&contextTitle=${encodeURIComponent(source?.nom || '')}`); }
  };

  if (!adaptiveOnly && type === 'boutique' && templateId === 'boutique_editorial') {
    return <BoutiqueEditorialTemplate preview={preview} accent={accent} />;
  }

  if (!adaptiveOnly && type === 'boutique' && templateId === 'boutique_neo_flux') {
    return <BoutiqueNeoFluxTemplate preview={preview} accent={accent || '#B8FF2C'} />;
  }

  if (!adaptiveOnly && type === 'boutique' && templateId === 'boutique_orbit_glass') {
    return <BoutiqueOrbitGlassTemplate preview={preview} accent={accent || '#C7FF3D'} />;
  }

  if (!adaptiveOnly && type === 'boutique' && templateId === 'boutique_float_form') {
    return <BoutiqueFloatFormTemplate preview={preview} accent={accent || '#6D5DF6'} />;
  }

  if (!adaptiveOnly && type === 'boutique' && templateId === 'boutique_pop_object') {
    return <BoutiquePopObjectTemplate preview={preview} accent={accent || '#D7FF4F'} />;
  }

  if (!adaptiveOnly && type === 'boutique' && templateId === 'boutique_spectrum_index') {
    return <BoutiqueSpectrumIndexTemplate preview={preview} accent={accent || '#00E5FF'} />;
  }

  if (!adaptiveOnly && type === 'boutique' && templateId === 'boutique_prism_vault') {
    return <BoutiquePrismVaultTemplate preview={preview} accent={accent || '#D9A8FF'} />;
  }

  if (!adaptiveOnly && type === 'boutique' && templateId === 'boutique_kinetic_atelier') {
    return <BoutiqueKineticAtelierTemplate preview={preview} accent={accent || '#FF3B30'} />;
  }

  if (!adaptiveOnly && type === 'restaurant' && templateId === 'restaurant_tempo') {
    return <RestaurantTempoTemplate preview={preview} accent={accent || '#8FF2C7'} />;
  }

  if (!adaptiveOnly && type === 'restaurant' && templateId === 'restaurant_editorial_dining') {
    return <RestaurantEditorialDiningTemplate preview={preview} accent={accent || '#FF4D2E'} />;
  }

  return (
    <div className={`storefront-renderer storefront-template-${template.layout}`} data-template={template.id}>
      <section className="storefront-hero">
        <MediaCarousel items={item.media} aspectRatio="wide" viewerTitle={item.title} viewerDescription={item.description} viewerMeta={item.location} />
        <div className="storefront-hero-overlay">
          <span className="storefront-badge">{label}</span>
          <h2>{item.title}</h2>
          <p>{item.subtitle}</p>
        </div>
      </section>

      <div className="storefront-head">
        <div>
          <div className="storefront-meta"><MapPin size={15} />{item.location}<span>•</span><span className="status-open">Ouvert</span></div>
          <div className="storefront-rating"><Star size={16} fill="currentColor" /> {item.rating} <span>({item.reviews} avis)</span></div>
        </div>
        {!preview && <div className="storefront-actions"><ShareButton title={item.title} text={item.description} /><Button onClick={contactOwner}><MessageCircle size={17} /> Contacter</Button>{type==='restaurant' && <Button onClick={()=>window.location.href=appPath(`/restaurant/${source?._id}/reserver`)}>Réserver</Button>}{type==='hotel' && <Button onClick={()=>window.location.href=appPath(`/hotel/${source?._id}/reserver`)}>Réserver un séjour</Button>}</div>}
      </div>

      <nav className="storefront-tabs"><a className="active">Accueil</a><a>{type === 'restaurant' ? 'Menu' : type === 'hotel' ? 'Chambres' : 'Catalogue'}</a><a>Avis</a><a>À propos</a></nav>

      <section className="storefront-content">
        <div className="storefront-main">
          <div className="storefront-intro">
            <span className="section-eyebrow">{isEditorial ? 'Notre univers' : 'Bienvenue'}</span>
            <h3>{item.subtitle}</h3>
            <p>{item.description}</p>
          </div>

          <div className="storefront-collection">
            <div className="collection-head">
              <div><span className="section-eyebrow">À découvrir</span><h3>{type === 'restaurant' ? 'Le menu' : type === 'hotel' ? 'Les chambres' : 'Les produits populaires'}</h3></div>
              <button className="text-action">Voir tout <ArrowRight size={16} /></button>
            </div>
            <div className="collection-grid">
              {(item.products?.length ? item.products : item.media).map((m: any, i: number) => {
                const image = m.photos?.[0] || m.image || m.src || item.media?.[i]?.src || '';
                const name = m.nom || m.name || (type === 'restaurant' ? `Suggestion ${i + 1}` : type === 'hotel' ? `Hébergement ${i + 1}` : `Sélection ${i + 1}`);
                const priceValue = m.prix ?? m.prixParNuit ?? m.price;
                const product: StorefrontProduct = {
                  id: String(m._id || m.id || `${type.toUpperCase()}-${String(i + 1).padStart(2, '0')}`),
                  name,
                  category: m.categorie || m.type || (type === 'restaurant' ? 'MENU' : type === 'hotel' ? 'HÉBERGEMENT' : 'CATALOGUE'),
                  price: typeof priceValue === 'number' ? `${new Intl.NumberFormat('fr-FR').format(priceValue)} FCFA${type === 'hotel' ? ' / nuit' : ''}` : (priceValue || 'Prix à consulter'),
                  image, alt: name,
                  description: m.description || '',
                  colors: [], sizes: [], details: [],
                  ingredients: m.ingredients || undefined,
                  commerceType: type === 'boutique' ? 'boutique' : type === 'restaurant' ? 'restaurant' : undefined,
                  produitId: type === 'boutique' ? String(m._id || '') : undefined,
                  platId: type === 'restaurant' ? String(m._id || '') : undefined,
                  boutiqueId: type === 'boutique' ? String(source?._id || '') : undefined,
                  restaurantId: type === 'restaurant' ? String(source?._id || '') : undefined,
                  seller: source?.nom || '',
                  unitPrice: typeof priceValue === 'number' ? priceValue : 0,
                };
                return (
                  <article className="storefront-product" key={m._id || m.id || `${type}-${i}`} role="button" tabIndex={0} onClick={() => setSelectedProduct(product)} onKeyDown={(event) => event.key === 'Enter' && setSelectedProduct(product)}>
                    {image ? <img src={image} alt={product.alt} /> : <div className="storefront-product-placeholder">{product.name}</div>}
                    <div><strong>{product.name}</strong><span>{isPremium ? 'Expérience disponible' : 'Disponible'}</span></div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
        <aside className="storefront-aside">
          <div className="aside-card">
            <strong>Informations</strong>
            <div><Clock3 size={16} /> {source.horaires || source.heuresOuverture || 'Horaires à consulter'}</div>
            <div><MapPin size={16} /> {item.location}</div>
            {!preview && <Button variant="secondary">Voir l’itinéraire</Button>}
          </div>
        </aside>
      </section>
      <StorefrontProductQuickView product={selectedProduct} open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} theme="neutral" preview={preview} />
    </div>
  );
}
