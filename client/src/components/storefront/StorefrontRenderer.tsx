import { useState } from 'react';
import { withAppBasePath } from '../../utils/appBasePath';
import { ArrowRight, Clock3, MapPin, MessageCircle, Star } from 'lucide-react';
import { Button } from '../primitives';
import { MediaCarousel } from '../media/MediaCarousel';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';
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
}: {
  type: StorefrontType;
  templateId?: string;
  preview?: boolean;
  accent?: string;
  data?: any;
  adaptiveOnly?: boolean;
}) {
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
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
  const hoursLabel = typeof source.horaires === 'string' ? source.horaires : typeof source.heuresOuverture === 'string' ? source.heuresOuverture : 'Horaires à consulter';
  const template = getStorefrontTemplates(type).find((entry) => entry.id === templateId) ?? getStorefrontTemplates(type)[0];
  const label = type === 'boutique' ? 'Boutique' : type === 'restaurant' ? 'Restaurant' : 'Hôtel';
  const isEditorial = template.layout === 'editorial';
  const contactOwner = async () => {
    const token = localStorage.getItem('token'); const owner = source?.proprietaire?._id || source?.proprietaire;
    if (!token || !owner) { if (!token) window.location.href=withAppBasePath(`/connexion?next=${encodeURIComponent('/messages')}`); return; }
    try { const c = await createConversation(String(owner), { type, id: String(source?._id || ''), titre: source?.nom || '' }, token); window.location.href=withAppBasePath(`/messages?conversationId=${c._id}`); } catch { window.location.href=withAppBasePath(`/messages?destinataireId=${encodeURIComponent(String(owner))}&contextType=${type}&contextId=${encodeURIComponent(String(source?._id || ''))}&contextTitle=${encodeURIComponent(source?.nom || '')}`); }
  };

  return (
    <div className={`storefront-renderer storefront-template-${template.layout} storefront-id-${template.id}`} data-template={template.id}>
      <section className="storefront-hero" id="top">
        <MediaCarousel items={item.media} aspectRatio="wide" viewerTitle={item.title} viewerDescription={item.description} viewerMeta={item.location} />
        <div className="storefront-hero-overlay">
          <span className="storefront-badge">{label}</span>
          <h2>{item.title}</h2>
          <p>{item.subtitle}</p>
        </div>
      </section>

      <div className="storefront-head">
        <div>
          <div className="storefront-meta"><MapPin size={15} />{item.location}<span>•</span><span className={source.estOuvert === true ? 'status-open' : source.estOuvert === false ? 'status-closed' : 'status-unknown'}>{source.estOuvert === true ? 'Ouvert' : source.estOuvert === false ? 'Fermé' : 'Horaires à consulter'}</span></div>
          <div className="storefront-rating"><Star size={16} fill="currentColor" /> {item.reviews > 0 ? <>{item.rating} <span>({item.reviews} avis)</span></> : <span>Aucun avis pour le moment</span>}</div>
        </div>
        {!preview && <div className="storefront-actions"><ShareButton title={item.title} text={item.description} cibleType={type === 'restaurant' ? 'restaurant' : type === 'hotel' ? 'hotel' : 'boutique'} cibleId={source?._id ? String(source._id) : undefined} /><Button onClick={contactOwner}><MessageCircle size={17} /> Contacter</Button>{type==='restaurant' && <Button onClick={()=>window.location.href=withAppBasePath(`/restaurant/${source?._id}/reserver`)}>Réserver</Button>}{type==='hotel' && <Button onClick={()=>window.location.href=withAppBasePath(`/hotel/${source?._id}/reserver`)}>Réserver un séjour</Button>}</div>}
      </div>

      <nav className="storefront-tabs"><a className="active" href="#top">Accueil</a><a href="#catalogue">{type === 'restaurant' ? 'Menu' : type === 'hotel' ? 'Chambres' : 'Catalogue'}</a><a href="#apropos">À propos</a></nav>

      <section className="storefront-content">
        <div className="storefront-main">
          <div className="storefront-intro" id="apropos">
            <span className="section-eyebrow">{isEditorial ? 'Notre univers' : 'Bienvenue'}</span>
            <h3>{item.subtitle}</h3>
            <p>{item.description}</p>
          </div>

          <div className="storefront-collection" id="catalogue">
            <div className="collection-head">
              <div><span className="section-eyebrow">À découvrir</span><h3>{type === 'restaurant' ? 'Le menu' : type === 'hotel' ? 'Les chambres' : 'Les produits populaires'}</h3></div>
              <a className="text-action" href="#catalogue">Voir tout <ArrowRight size={16} /></a>
            </div>
            {item.products.length === 0 ? <div className="storefront-catalog-empty"><span className="storefront-empty-icon">{type === 'restaurant' ? '🍽️' : type === 'hotel' ? '🛏️' : '▦'}</span><strong>{type === 'restaurant' ? 'La carte se prépare' : type === 'hotel' ? 'Les hébergements arrivent bientôt' : 'Le catalogue se prépare'}</strong><p>{preview ? 'Ajoutez vos premiers contenus pour compléter cette section.' : 'Aucun contenu public n’est disponible dans cette section pour le moment.'}</p></div> : <div className="collection-grid">
              {item.products.map((m: any, i: number) => {
                const image = m.photos?.[0] || m.image || m.src || item.media?.[i]?.src || '';
                const name = m.nom || m.name || (type === 'restaurant' ? `Suggestion ${i + 1}` : type === 'hotel' ? `Hébergement ${i + 1}` : `Sélection ${i + 1}`);
                const priceValue = m.prix ?? m.prixParNuit ?? m.price;
                const available = type === 'boutique' ? m.statut !== 'rupture' && Number(m.quantiteDisponible || 0) > 0 : type === 'restaurant' ? m.disponible !== false : true;
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
                  available,
                };
                return (
                  <article className="storefront-product" key={m._id || m.id || `${type}-${i}`} role="button" tabIndex={0} aria-label={`Consulter ${product.name}`} onClick={() => setSelectedProduct(product)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedProduct(product); } }}>
                    {image ? <img src={image} alt={product.alt} /> : <div className="storefront-product-placeholder">{product.name}</div>}
                    <div><strong>{product.name}</strong><span>{type === 'hotel' ? 'Réservation disponible' : available ? 'Disponible' : 'Indisponible'}</span></div>
                  </article>
                );
              })}
            </div>}
          </div>
        </div>
        <aside className="storefront-aside">
          <div className="aside-card">
            <strong>Informations</strong>
            <div><Clock3 size={16} /> {hoursLabel}</div>
            <div><MapPin size={16} /> {item.location}</div>
            {!preview && <a className="button button-secondary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`} target="_blank" rel="noreferrer">Voir l’itinéraire</a>}
          </div>
        </aside>
      </section>
      <StorefrontProductQuickView product={selectedProduct} open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} theme="neutral" preview={preview} />
    </div>
  );
}
