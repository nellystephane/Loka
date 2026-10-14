import { useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { ArrowDownRight, ArrowRight, Heart, Menu, Search, ShoppingBag } from 'lucide-react';
import { publicItems } from '../../data/demo';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';

export function BoutiqueKineticAtelierTemplate({ preview = false, accent = '#FF3B30' }: { preview?: boolean; accent?: string }) {
  const item = publicItems.shop;
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const products: StorefrontProduct[] = [
    {
      id: 'KA-01', name: 'Motion Coat', category: 'OUTERWEAR', price: '68 000 FCFA', image: item.media[1].src, alt: item.media[1].alt,
      description: 'Une silhouette structurée pensée pour bouger. La fiche produit conserve les variantes et attributs saisis par la boutique.',
      colors: ['#171717', '#D8D2C8', '#FF3B30'], sizes: ['S', 'M', 'L', 'XL'],
      details: [{ label: 'Matière', value: 'Textile mixte' }, { label: 'Coupe', value: 'Relaxed' }, { label: 'Disponibilité', value: 'En stock' }]
    },
    {
      id: 'KA-02', name: 'Frame Knit', category: 'KNITWEAR', price: '39 000 FCFA', image: item.media[0].src, alt: item.media[0].alt,
      description: 'Une pièce souple aux proportions nettes, présentée comme un objet éditorial dans la vitrine.',
      colors: ['#F1EEE7', '#303030', '#B5A89B'], sizes: ['S', 'M', 'L'],
      details: [{ label: 'Matière', value: 'Maille souple' }, { label: 'Édition', value: '026' }, { label: 'Disponibilité', value: 'En stock' }]
    },
    {
      id: 'KA-03', name: 'Signal Bag', category: 'ACCESSORIES', price: '31 000 FCFA', image: item.media[1].src, alt: item.media[1].alt,
      description: 'Un accessoire compact dont la couleur accent devient un élément graphique de la collection.',
      colors: ['#FF3B30', '#151515', '#E5DED3'], sizes: ['Unique'],
      details: [{ label: 'Format', value: 'Unique' }, { label: 'Matière', value: 'Cuir synthétique' }, { label: 'Série', value: 'Limited' }]
    },
    {
      id: 'KA-04', name: 'Studio Pant', category: 'BOTTOMS', price: '44 000 FCFA', image: item.media[0].src, alt: item.media[0].alt,
      description: 'Un pantalon pensé pour une silhouette graphique, avec tailles et coloris gérés depuis le catalogue Boutique.',
      colors: ['#171717', '#72685E', '#E8E0D5'], sizes: ['S', 'M', 'L', 'XL'],
      details: [{ label: 'Coupe', value: 'Straight' }, { label: 'Matière', value: 'Coton' }, { label: 'Disponibilité', value: 'À vérifier' }]
    },
  ];

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({ x: ((event.clientX - rect.left) / rect.width - 0.5) * 2, y: ((event.clientY - rect.top) / rect.height - 0.5) * 2 });
  }

  function resetPointer() {
    setPointer({ x: 0, y: 0 });
  }

  return (
    <div className="kinetic-atelier-template" style={{ '--ka-accent': accent || '#FF3B30', '--ka-px': `${pointer.x * 12}px`, '--ka-py': `${pointer.y * 10}px` } as CSSProperties}>
      <div className="ka-shell">
        <header className="ka-nav">
          <button className="ka-menu" aria-label="Menu"><Menu size={18} /></button>
          <a href="#ka-top" className="ka-logo"><span className="ka-logo-mark">K</span><strong>ATELIER / 026</strong></a>
          <nav><a href="#ka-edit">COLLECTION</a><a href="#ka-motion">MOTION</a><a href="#ka-house">HOUSE</a></nav>
          <div className="ka-actions"><button aria-label="Rechercher"><Search size={17} /></button><button aria-label="Panier"><ShoppingBag size={17} /></button>{!preview && <button aria-label="Favoris"><Heart size={17} /></button>}</div>
        </header>

        <main>
          <section className="ka-hero" id="ka-top" onPointerMove={handlePointerMove} onPointerLeave={resetPointer}>
            <div className="ka-grid" />
            <div className="ka-orbit ka-orbit-one" />
            <div className="ka-orbit ka-orbit-two" />
            <div className="ka-hero-topline"><span>MAISON NAYA / COTONOU</span><span>DROP 026 / 04—12</span></div>
            <div className="ka-hero-copy">
              <span className="ka-index">01 / NEW MOVEMENT</span>
              <h1>MOVE<br /><em>THE FORM.</em></h1>
              <p>Une vitrine vivante où les produits, la typographie et le mouvement composent une seule scène.</p>
              <a href="#ka-edit" className="ka-hero-cta">VIEW COLLECTION <ArrowRight size={16} /></a>
            </div>
            <div className="ka-hero-product" style={{ transform: `translate3d(var(--ka-px), var(--ka-py), 0)` }}>
              <div className="ka-product-frame"><img src={item.media[1].src} alt="Sélection de la boutique" /></div>
              <span className="ka-product-tag">OBJECT / 01</span>
              <span className="ka-product-price">FROM<br /><b>39 000</b> FCFA</span>
            </div>
            <div className="ka-hero-number">026</div>
            <div className="ka-scroll-cue"><span>SCROLL</span><ArrowDownRight size={15} /></div>
          </section>

          <div className="ka-marquee" id="ka-motion" aria-label="Atelier motion marquee">
            <div className="ka-marquee-track"><span>FORM / FUNCTION</span><i>✦</i><span>LOCAL OBJECTS</span><i>✦</i><span>MOVE WITH PURPOSE</span><i>✦</i><span>FORM / FUNCTION</span><i>✦</i><span>LOCAL OBJECTS</span><i>✦</i><span>MOVE WITH PURPOSE</span><i>✦</i></div>
          </div>

          <section className="ka-intro">
            <div className="ka-intro-index">02</div>
            <div><span className="ka-kicker">THE COLLECTION</span><h2>Designed to be<br /><em>seen in motion.</em></h2></div>
            <p>Chaque produit peut alimenter cette composition avec ses photos, variantes, tailles, couleurs, attributs et disponibilité. Le template reste indépendant du contenu.</p>
          </section>

          <section className="ka-edit" id="ka-edit">
            <div className="ka-section-head"><div><span>03 / EDIT 026</span><h2>THE<br /><em>SEQUENCE.</em></h2></div><button>ALL PRODUCTS <ArrowRight size={15} /></button></div>
            <div className="ka-product-grid">
              {products.map((product, index) => (
                <button key={product.id} className={`ka-card ka-card-${index + 1}`} onClick={() => setSelected(product)} aria-label={`Voir ${product.name}`}>
                  <div className="ka-card-media"><img src={product.image} alt={product.alt} /><span>0{index + 1}</span><b>{index === 2 ? 'LIMITED' : 'AVAILABLE'}</b></div>
                  <div className="ka-card-info"><div><strong>{product.name}</strong><small>{product.category}</small></div><span>{product.price}</span></div>
                </button>
              ))}
            </div>
          </section>

          <section className="ka-motion-panel">
            <div className="ka-motion-type"><span>04 / MOTION STUDY</span><h2>EVERY<br /><em>SECOND<br />COUNTS.</em></h2></div>
            <div className="ka-motion-stage">
              <div className="ka-motion-ring ka-motion-ring-a" /><div className="ka-motion-ring ka-motion-ring-b" />
              <div className="ka-motion-label ka-motion-label-a">MOVE / 01</div><div className="ka-motion-label ka-motion-label-b">FORM / 02</div>
              <div className="ka-motion-core">K</div>
            </div>
            <p>Animations de respiration, déplacement au survol, ticker continu et profondeur du hero. Le mouvement est désactivé ou réduit automatiquement lorsque l’utilisateur le demande.</p>
          </section>

          <section className="ka-house" id="ka-house">
            <div className="ka-house-image"><img src={item.media[0].src} alt="Maison Naya" /><span>05 / THE HOUSE</span></div>
            <div className="ka-house-copy"><span className="ka-kicker">THE PLACE</span><h2>A STORE<br /><em>IN MOTION.</em></h2><p>{item.description}</p><div className="ka-house-facts"><span><b>4.8</b> NOTE</span><span><b>126</b> AVIS</span><span><b>08—20</b> HORAIRES</span></div><a href="#ka-top">BACK TO TOP <ArrowRight size={15} /></a></div>
          </section>
        </main>

        <footer className="ka-footer"><span>ATELIER / 026</span><span>Vitrine Loka</span><span>MAISON NAYA · COTONOU</span></footer>
      </div>
      <StorefrontProductQuickView product={selected} open={Boolean(selected)} onClose={() => setSelected(null)} theme="kineticatelier" preview={preview} />
    </div>
  );
}
