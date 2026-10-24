import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Heart, Search, ShoppingBag, UserRound, Menu, Star, Plus } from 'lucide-react';
import { publicItems } from '../../data/demo';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';

export function BoutiquePopObjectTemplate({ preview = false, accent = '#D7FF4F' }: { preview?: boolean; accent?: string }) {
  const item = publicItems.shop;
  const signature = accent || '#D7FF4F';
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const products: (StorefrontProduct & { bg: string; tilt: string })[] = [
    { id: 'PO-01', name: 'Form 01', category: 'SIGNATURE', price: '45 000 FCFA', image: item.media[1].src, alt: item.media[1].alt, bg: '#FF5C35', tilt: '-3deg', description: 'Une pièce signature pensée pour accompagner le quotidien avec une présence graphique.', colors: ['#111111', '#FF5C35', '#F7F7F2'], sizes: ['S', 'M', 'L', 'XL'], details: [{ label: 'Matière', value: 'Coton & textile mixte' }, { label: 'Disponibilité', value: 'En stock' }, { label: 'Origine', value: 'Sélection locale' }] },
    { id: 'PO-02', name: 'Object 02', category: 'COLLECTION', price: '32 000 FCFA', image: item.media[0].src, alt: item.media[0].alt, bg: '#6C4DFF', tilt: '2deg', description: 'Une forme plus douce, sélectionnée pour son équilibre entre usage et caractère.', colors: ['#6C4DFF', '#9EEAFF', '#FFFFFF'], sizes: ['Unique'], details: [{ label: 'Matière', value: 'Textile souple' }, { label: 'Disponibilité', value: 'En stock' }, { label: 'Édition', value: 'Drop local' }] },
    { id: 'PO-03', name: 'Edit 03', category: 'LIMITED', price: '58 000 FCFA', image: item.media[1].src, alt: item.media[1].alt, bg: '#111111', tilt: '-1deg', description: 'Une édition plus rare, conçue pour devenir le point focal d’une silhouette.', colors: ['#111111', '#D7FF4F', '#FF5C35'], sizes: ['M', 'L'], details: [{ label: 'Matière', value: 'Textile premium' }, { label: 'Disponibilité', value: 'Dernières pièces' }, { label: 'Édition', value: 'Limited' }] },
  ];

  return (
    <div className="popobject-template" style={{ '--pop-accent': signature } as CSSProperties}>
      <div className="popobject-atmosphere" aria-hidden="true">
        <span className="popobject-orb popobject-orb-a" />
        <span className="popobject-orb popobject-orb-b" />
        <span className="popobject-orb popobject-orb-c" />
      </div>

      <div className="popobject-shell">
        <header className="popobject-nav">
          <button className="popobject-icon" aria-label="Menu"><Menu size={18} /></button>
          <a className="popobject-brand" href="#pop-hero"><span>NO</span><strong>NOVA OBJECTS</strong></a>
          <nav><a href="#pop-products" className="active">Shop</a><a href="#pop-products">Search</a><a href="#pop-collection">Category</a><a href="#pop-story">Collection</a></nav>
          <div className="popobject-actions">
            <button className="popobject-icon" aria-label="Rechercher"><Search size={17} /></button>
            <button className="popobject-icon popobject-cart" aria-label="Panier"><ShoppingBag size={17} /><i>2</i></button>
            <button className="popobject-icon" aria-label="Profil"><UserRound size={16} /></button>
          </div>
        </header>

        <main>
          <section className="popobject-hero" id="pop-hero">
            <div className="popobject-hero-copy">
              <span className="popobject-kicker">MAISON NAYA · COTONOU · 01</span>
              <h1>MOVE<br /><em>DIFFERENT.</em></h1>
              <p>Une sélection locale pensée comme une collection d'objets : expressive, portable et impossible à confondre.</p>
              <div className="popobject-hero-actions">
                <a className="popobject-primary" href="#pop-products">Découvrir <ArrowRight size={17} /></a>
                <span><Star size={14} fill="currentColor" /> 4.8 · 126 avis</span>
              </div>
            </div>

            <div className="popobject-hero-stage">
              <div className="popobject-shape popobject-shape-pink" />
              <div className="popobject-shape popobject-shape-purple" />
              <div className="popobject-hero-card" role="button" tabIndex={0} onClick={() => setSelected(products[0])} onKeyDown={(event) => event.key === 'Enter' && setSelected(products[0])} aria-label="Voir les détails de Form 01">
                <div className="popobject-card-top"><span>01 / SIGNATURE</span><button aria-label="Favori"><Heart size={16} /></button></div>
                <img src={item.media[1].src} alt={item.media[1].alt} />
                <div className="popobject-hero-product">
                  <div><strong>Form 01</strong><small>stable fit · everyday object</small></div>
                  <b>45 000</b>
                </div>
                <button className="popobject-floating-plus" aria-label="Ajouter"><Plus size={18} /></button>
              </div>
              <div className="popobject-sticker">NOVA<br /><small>01</small></div>
              <div className="popobject-dots"><span className="active" /><span /><span /><span /></div>
            </div>
          </section>

          <div className="popobject-rail"><span>NEW OBJECTS</span><span>LOCAL CURATION</span><span>DESIGNED TO BE SEEN</span><span>NEW OBJECTS</span></div>

          <section className="popobject-products" id="pop-products">
            <div className="popobject-section-head"><div><span className="popobject-kicker">02 / OBJECTS</span><h2>Pick<br /><em>your form.</em></h2></div><p>Chaque pièce possède sa propre scène. Les informations restent simples pour laisser la matière et le produit prendre la place qu'ils méritent.</p></div>
            <div className="popobject-product-grid">
              {products.map((product, index) => (
                <article className={`popobject-product popobject-product-${index + 1}`} key={product.id}>
                  <div className="popobject-product-click" role="button" tabIndex={0} onClick={() => setSelected(product)} onKeyDown={(event) => event.key === 'Enter' && setSelected(product)} aria-label={`Voir les détails de ${product.name}`}>
                  <div className="popobject-product-stage" style={{ '--product-bg': product.bg } as CSSProperties}>
                    <span className="popobject-product-index">0{index + 1}</span>
                    <div className="popobject-product-block" />
                    <img src={product.image} alt={product.alt} style={{ transform: `translate(-50%, -52%) rotate(${product.tilt})` }} />
                    <button className="popobject-product-add" aria-label={`Ajouter ${product.name}`}><Plus size={16} /></button>
                  </div>
                  </div>
                  <div className="popobject-product-info"><div><strong>{product.name}</strong><span>Maison Naya · sélection</span></div><b>{product.price}</b></div>
                </article>
              ))}
            </div>
          </section>

          <section className="popobject-campaign" id="pop-collection">
            <div className="popobject-campaign-copy"><span className="popobject-kicker">03 / COLLECTION</span><h2>NOT<br />ANOTHER<br /><em>PRODUCT.</em></h2><p>Un objet devient une pièce quand on lui donne de l'espace, une attitude et une histoire.</p><a href="#pop-story">Voir la collection <ArrowRight size={17} /></a></div>
            <div className="popobject-campaign-visual"><div className="popobject-campaign-disc" /><img src={item.media[0].src} alt="Intérieur de Maison Naya" /><span className="popobject-campaign-label">THE HOUSE<br /><strong>2026</strong></span></div>
          </section>

          <section className="popobject-story" id="pop-story">
            <div className="popobject-story-head"><span className="popobject-kicker">04 / THE HOUSE</span><h2>Objects with<br /><em>attitude.</em></h2></div>
            <div className="popobject-story-copy"><p>{item.description}</p><div className="popobject-story-meta"><span><strong>4.8</strong> NOTE</span><span><strong>126</strong> AVIS</span><span><strong>08—20</strong> OUVERT</span></div>{!preview && <button className="popobject-outline">Contacter la boutique <ArrowRight size={16} /></button>}</div>
          </section>
        </main>

        <footer className="popobject-footer"><div><span>NO</span><strong>NOVA OBJECTS</strong></div><span>Une vitrine Loka</span><span>Cotonou · Haie Vive</span><span>© 2026</span></footer>
      </div>

      <StorefrontProductQuickView product={selected} open={Boolean(selected)} onClose={() => setSelected(null)} theme="popobject" preview={preview} />
      <div className="popobject-mobile-bar"><button className="active"><ShoppingBag size={17} /><span>Shop</span></button><button><Search size={17} /><span>Search</span></button><button><Heart size={17} /><span>Favoris</span></button>{!preview && <button><UserRound size={17} /><span>Compte</span></button>}</div>
    </div>
  );
}
