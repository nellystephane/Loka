import { ArrowDownRight, ArrowUpRight, Heart, Menu, MoveUpRight, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { publicItems } from '../../data/demo';
import { buildBoutiqueProducts } from './boutiqueProductData';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';

export function BoutiqueNeoFluxTemplate({ preview = false, accent = '#B8FF2C' }: { preview?: boolean; accent?: string }) {
  const item = publicItems.shop;
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const products = buildBoutiqueProducts(item);
  const [hero, secondary] = item.media;
  const fluxProducts = [
    { name: 'SIGNATURE 01', note: 'Pièce essentielle', image: hero.src },
    { name: 'SIGNATURE 02', note: 'Édition locale', image: secondary.src },
    { name: 'SIGNATURE 03', note: 'Nouvelle sélection', image: hero.src },
  ];

  return (
    <article className="nf-template" style={{ '--nf-accent': accent } as React.CSSProperties}>
      <header className="nf-nav">
        <a className="nf-logo" href="#top"><span>MN</span><strong>Maison Naya</strong></a>
        <nav><a href="#drop">Drop 01</a><a href="#studio">Studio</a><a href="#selection">Selection</a><a href="#contact">Visit</a></nav>
        <div className="nf-nav-actions"><button aria-label="Partager"><Share2 size={17} /></button>{!preview && <button aria-label="Enregistrer"><Heart size={17} /></button>}<button aria-label="Menu"><Menu size={19} /></button></div>
      </header>

      <section className="nf-hero" id="top">
        <div className="nf-hero-orbit" aria-hidden="true">MN · 2026 · COTONOU · MN · 2026 · COTONOU ·</div>
        <div className="nf-hero-copy">
          <span className="nf-index">DROP 01 / 2026</span>
          <h1>MAKE<br /><em>SPACE.</em></h1>
          <p>{item.description}</p>
          <a className="nf-cta" href="#selection">Explore the drop <ArrowDownRight size={18} /></a>
        </div>
        <div className="nf-hero-image"><img src={hero.src} alt={hero.alt} /><div className="nf-image-stamp"><span>01</span><span>MAISON NAYA</span></div></div>
        <div className="nf-hero-side"><span>LOCAL / GLOBAL</span><span>06.20.26</span></div>
      </section>

      <section className="nf-strip" aria-hidden="true"><span>NOT A SHOP</span><i>✦</i><span>A POINT OF VIEW</span><i>✦</i><span>COTONOU</span><i>✦</i><span>LOKA</span></section>

      <section className="nf-statement" id="studio">
        <div className="nf-statement-number">02</div>
        <div className="nf-statement-copy"><span className="nf-label">THE STUDIO</span><h2>Ordinary pieces.<br /><em>Unordinary presence.</em></h2></div>
        <div className="nf-statement-note"><p>Maison Naya curates fashion and objects with a local point of view. The storefront is intentionally loud in composition, quiet in information.</p><a href="#contact">Meet the house <MoveUpRight size={16} /></a></div>
      </section>

      <section className="nf-selection" id="selection">
        <div className="nf-section-head"><div><span className="nf-label">03 / THE DROP</span><h2>Current signal</h2></div><a href="#selection">View all <ArrowUpRight size={16} /></a></div>
        <div className="nf-product-rail">
          {fluxProducts.map((product, index) => (
            <article className={`nf-product ${index === 1 ? 'is-featured' : ''}`} key={product.name} role="button" tabIndex={0} onClick={() => setSelected(products[index])} onKeyDown={(event) => event.key === 'Enter' && setSelected(products[index])}>
              <div className="nf-product-media"><img src={product.image} alt="" /><span>0{index + 1}</span><button aria-label={`Voir ${product.name}`}><ArrowUpRight size={18} /></button></div>
              <div className="nf-product-meta"><strong>{product.name}</strong><small>{product.note}</small></div>
            </article>
          ))}
        </div>
      </section>

      <section className="nf-collage">
        <div className="nf-collage-a"><img src={secondary.src} alt={secondary.alt} /><span>04</span></div>
        <div className="nf-collage-b"><span className="nf-label">THE MOOD</span><strong>Less<br /><em>expected.</em></strong><p>Une vitrine pensée pour celles et ceux qui préfèrent découvrir une marque plutôt que simplement parcourir un catalogue.</p></div>
        <div className="nf-collage-c"><span>OBJECT / 001</span><img src={hero.src} alt="" /></div>
      </section>

      <section className="nf-contact" id="contact">
        <div className="nf-contact-title"><Sparkles size={18} /><span>05 / VISIT</span><h2>Come<br /><em>through.</em></h2></div>
        <div className="nf-contact-details"><div><span>LOCATION</span><strong>{item.location}</strong></div><div><span>HOURS</span><strong>08:00 — 20:00</strong></div><a className="nf-light-cta" href="#contact">Open directions <ArrowUpRight size={17} /></a></div>
      </section>

      <StorefrontProductQuickView product={selected} open={Boolean(selected)} onClose={() => setSelected(null)} theme="neoflux" preview={preview} />
      <footer className="nf-footer"><div><strong>MN</strong><span>Maison Naya</span></div><span>Une vitrine Loka</span><span>© 2026 / Cotonou</span></footer>
    </article>
  );
}
