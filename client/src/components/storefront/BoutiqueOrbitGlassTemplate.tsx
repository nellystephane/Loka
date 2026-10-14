import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Heart, MapPin, MessageCircle, Search, Share2, SlidersHorizontal, Sparkles, UserRound } from 'lucide-react';
import { publicItems } from '../../data/demo';
import { buildBoutiqueProducts } from './boutiqueProductData';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';

export function BoutiqueOrbitGlassTemplate({ preview = false, accent = '#C7FF3D' }: { preview?: boolean; accent?: string }) {
  const item = publicItems.shop;
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const products = buildBoutiqueProducts(item);
  const signature = accent || '#C7FF3D';

  return (
    <div className="orbit-template" style={{ '--orbit-accent': signature } as CSSProperties}>
      <header className="orbit-nav">
        <div className="orbit-brand"><span className="orbit-mark">N</span><strong>{item.title}</strong></div>
        <nav><a href="#orbit-featured">Collection</a><a href="#orbit-discover">Découvrir</a><a href="#orbit-about">Maison</a></nav>
        <div className="orbit-nav-actions">
          {!preview && <button aria-label="Partager"><Share2 size={16} /></button>}
          <button aria-label="Compte"><UserRound size={17} /></button>
        </div>
      </header>

      <main>
        <section className="orbit-hero">
          <div className="orbit-copy">
            <span className="orbit-kicker">COTONOU · HAIE VIVE · 04—26</span>
            <h1>Wear<br /><em>the unexpected.</em></h1>
            <p>{item.description}</p>
            <div className="orbit-hero-actions">
              {!preview && <a className="orbit-primary" href="#orbit-featured">Explorer <ArrowRight size={17} /></a>}
              <a className="orbit-text-link" href="#orbit-about">Notre sélection</a>
            </div>
          </div>

          <div className="orbit-hero-stage">
            <div className="orbit-stage-glow" />
            <div className="orbit-image-frame">
              <img src={item.media[1].src} alt={item.media[1].alt} />
              <span className="orbit-image-label">NEW / 01</span>
            </div>
            <div className="orbit-floating-spec">
              <span>Maison Naya</span>
              <strong>Haie Vive</strong>
              <small>4.8 ★ · 126 avis</small>
            </div>
            <div className="orbit-disc" style={{ borderColor: signature }}>
              <Sparkles size={15} />
              <span>CURATED<br />LOCAL<br />OBJECTS</span>
            </div>
          </div>

          <div className="orbit-vertical">SCROLL TO DISCOVER · SCROLL TO DISCOVER ·</div>
        </section>

        <div className="orbit-search-wrap">
          <div className="orbit-search">
            <Search size={19} />
            <span>Rechercher une pièce, une collection...</span>
            <button aria-label="Filtres"><SlidersHorizontal size={17} /></button>
          </div>
          <div className="orbit-search-meta"><span>01</span><span>CATALOGUE</span><span>03</span></div>
        </div>

        <section className="orbit-featured" id="orbit-featured">
          <div className="orbit-section-head">
            <div><span className="orbit-kicker">01 / FEATURED</span><h2>Selected<br /><em>pieces.</em></h2></div>
            <p>Des objets choisis pour leur présence, leur usage et ce petit quelque chose qui les rend difficiles à oublier.</p>
          </div>

          <div className="orbit-product-grid">
            <article className="orbit-product orbit-product-large" role="button" tabIndex={0} onClick={() => setSelected(products[0])} onKeyDown={(event) => event.key === 'Enter' && setSelected(products[0])}>
              <div className="orbit-product-media"><img src={item.media[0].src} alt={item.media[0].alt} /><span>01</span><button aria-label="Ajouter aux favoris"><Heart size={17} /></button></div>
              <div className="orbit-product-info"><div><strong>La maison, en mouvement</strong><small>Collection signature</small></div><b>Voir</b></div>
            </article>
            <article className="orbit-product orbit-product-offset" role="button" tabIndex={0} onClick={() => setSelected(products[1])} onKeyDown={(event) => event.key === 'Enter' && setSelected(products[1])}>
              <div className="orbit-product-media"><img src={item.media[1].src} alt={item.media[1].alt} /><span>02</span><button aria-label="Ajouter aux favoris"><Heart size={17} /></button></div>
              <div className="orbit-product-info"><div><strong>Formes essentielles</strong><small>Édition 04</small></div><b>Voir</b></div>
            </article>
            <article className="orbit-product orbit-product-small" role="button" tabIndex={0} onClick={() => setSelected(products[2])} onKeyDown={(event) => event.key === 'Enter' && setSelected(products[2])}>
              <div className="orbit-product-media orbit-placeholder"><span>03</span><div>MORE<br /><em>SOON</em></div></div>
              <div className="orbit-product-info"><div><strong>La prochaine sélection</strong><small>À venir</small></div><b>Suivre</b></div>
            </article>
          </div>
        </section>

        <section className="orbit-discover" id="orbit-discover">
          <div className="orbit-discover-image"><img src={item.media[0].src} alt="Intérieur de Maison Naya" /></div>
          <div className="orbit-discover-copy">
            <span className="orbit-kicker">02 / THE HOUSE</span>
            <h2>Not a store.<br /><em>A point of view.</em></h2>
            <p>Maison Naya transforme la vitrine en espace de découverte : moins de bruit, plus de caractère. Chaque collection est pensée comme une courte conversation entre matière, silhouette et quotidien.</p>
            <div className="orbit-stat-row"><div><strong>4.8</strong><small>rating</small></div><div><strong>126</strong><small>avis</small></div><div><strong>08—20</strong><small>aujourd'hui</small></div></div>
            {!preview && <a className="orbit-primary dark" href="#orbit-about">Entrer dans la maison <ArrowRight size={17} /></a>}
          </div>
        </section>

        <section className="orbit-location" id="orbit-about">
          <div><span className="orbit-kicker">03 / FIND US</span><h2>Come<br /><em>closer.</em></h2></div>
          <div className="orbit-location-card">
            <MapPin size={19} /><div><strong>Haie Vive, Cotonou</strong><span>Ouvert aujourd'hui · 08:00—20:00</span></div>
            {!preview && <button>Itinéraire <ArrowRight size={16} /></button>}
          </div>
        </section>
      </main>

      <StorefrontProductQuickView product={selected} open={Boolean(selected)} onClose={() => setSelected(null)} theme="orbit" preview={preview} />
      <footer className="orbit-footer">
        <div><span className="orbit-mark">N</span><strong>Maison Naya</strong></div>
        <span>Une vitrine Loka</span>
        <span>© 2026</span>
      </footer>

      <div className="orbit-mobile-dock">
        <button className="active"><Search size={17} /><span>Explorer</span></button>
        <button><Heart size={17} /><span>Favoris</span></button>
        {!preview && <button><MessageCircle size={17} /><span>Contacter</span></button>}
        <button><UserRound size={17} /><span>Profil</span></button>
      </div>
    </div>
  );
}
