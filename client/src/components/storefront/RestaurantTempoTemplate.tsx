import { useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, MapPin, MessageCircle, Minus, Plus, Sparkles, Utensils, X } from 'lucide-react';
import { publicItems } from '../../data/demo';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';

export function RestaurantTempoTemplate({ preview = false, accent = '#8FF2C7' }: { preview?: boolean; accent?: string }) {
  const item = publicItems.restaurant;
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const [category, setCategory] = useState('PLATS');

  const dishes: StorefrontProduct[] = [
    { id: 'RT-01', name: 'Mafé signature', category: 'PLATS', price: '8 500 FCFA', image: item.media[1].src, alt: 'Plat du restaurant', description: 'Une interprétation généreuse de la maison, pensée pour être dégustée sur place ou à emporter.', colors: ['#8FF2C7', '#FFC857'], sizes: ['Simple', 'Double'], details: [{ label: 'Disponibilité', value: 'Aujourd’hui' }, { label: 'Service', value: 'Sur place / à emporter' }, { label: 'Épicé', value: 'Sur demande' }], ingredients: ['Base arachide', 'Légumes du jour', 'Protéine au choix'] },
    { id: 'RT-02', name: 'Poisson braisé', category: 'PLATS', price: '10 000 FCFA', image: item.media[0].src, alt: 'Ambiance de restaurant', description: 'Poisson préparé à la minute avec accompagnement maison. Les informations alimentaires restent affichées dans la fiche.', colors: ['#8FF2C7', '#0C221A'], sizes: ['1 personne', '2 personnes'], details: [{ label: 'Préparation', value: 'À la commande' }, { label: 'Service', value: 'Sur place / à emporter' }, { label: 'Allergènes', value: 'À préciser' }], ingredients: ['Poisson', 'Herbes fraîches', 'Accompagnement maison'] },
    { id: 'RT-03', name: 'Bowl marché', category: 'PLATS', price: '7 000 FCFA', image: item.media[1].src, alt: 'Bowl servi au restaurant', description: 'Composition fraîche modulable selon les produits disponibles du marché.', colors: ['#FFC857', '#8FF2C7'], sizes: ['Normal', 'Grand'], details: [{ label: 'Disponibilité', value: 'Selon marché' }, { label: 'Préparation', value: 'Rapide' }, { label: 'Option', value: 'Végétarienne' }], ingredients: ['Céréale', 'Légumes', 'Sauce maison'] },
    { id: 'RT-04', name: 'Jus bissap', category: 'BOISSONS', price: '2 000 FCFA', image: item.media[0].src, alt: 'Service au restaurant', description: 'Boisson fraîche maison disponible selon le service du jour.', colors: ['#D85A76', '#8FF2C7'], sizes: ['33 cl', '50 cl'], details: [{ label: 'Service', value: 'Frais' }, { label: 'Disponibilité', value: 'Aujourd’hui' }, { label: 'Format', value: 'À emporter' }], ingredients: ['Bissap', 'Citron', 'Sucre'] },
  ];

  const filtered = category === 'PLATS' ? dishes : dishes.filter((dish) => dish.category === category);

  return (
    <div className="restaurant-tempo" style={{ '--rt-accent': accent || '#8FF2C7' } as React.CSSProperties}>
      <header className="rt-nav">
        <a href="#rt-top" className="rt-brand"><span>TM</span><strong>TABLE / TEMPO</strong></a>
        <nav><a href="#rt-menu">MENU</a><a href="#rt-room">LA MAISON</a><a href="#rt-booking">RÉSERVER</a></nav>
        <div className="rt-nav-meta"><span><span className="rt-live-dot" /> OUVERT</span>{!preview && <a href="#rt-booking"><CalendarDays size={16} /></a>}</div>
      </header>

      <main>
        <section className="rt-hero" id="rt-top">
          <div className="rt-hero-noise" />
          <div className="rt-hero-copy">
            <span className="rt-index">01 / COTONOU · AKPAKPA</span>
            <h1>GOOD<br /><em>FOOD</em><br />MOVES.</h1>
            <p>{item.description}</p>
            <div className="rt-hero-actions"><a href="#rt-menu">VOIR LA CARTE <ArrowRight size={16} /></a><a href="#rt-booking" className="rt-ghost">RÉSERVER</a></div>
          </div>
          <div className="rt-hero-visual">
            <div className="rt-ring rt-ring-a" /><div className="rt-ring rt-ring-b" />
            <div className="rt-food-frame"><img src={item.media[1].src} alt="Cuisine du restaurant" /><span className="rt-floating-label">SERVI À LA MINUTE</span></div>
            <div className="rt-hero-stamp"><Utensils size={17} /><span>CHEZ<br />MARCEL</span></div>
          </div>
          <div className="rt-scroll"><span>SCROLL TO TASTE</span><ArrowRight size={14} /></div>
        </section>

        <div className="rt-marquee"><div className="rt-marquee-track"><span>LOCAL · FRESH · SHARED</span><i>✦</i><span>LOCAL · FRESH · SHARED</span><i>✦</i><span>LOCAL · FRESH · SHARED</span><i>✦</i><span>LOCAL · FRESH · SHARED</span><i>✦</i></div></div>

        <section className="rt-intro" id="rt-room">
          <div className="rt-intro-number">02</div>
          <div><span className="rt-kicker">THE HOUSE</span><h2>Une table locale,<br /><em>un rythme vivant.</em></h2></div>
          <p>La vitrine peut présenter l'histoire du lieu, la cuisine, les horaires, les services sur place et à emporter, ainsi que les informations utiles avant la réservation.</p>
        </section>

        <section className="rt-menu" id="rt-menu">
          <div className="rt-menu-head"><div><span className="rt-kicker">03 / LA CARTE</span><h2>CHOISISSEZ<br /><em>VOTRE RYTHME.</em></h2></div><span className="rt-menu-note">Carte mise à jour par le restaurant</span></div>
          <div className="rt-categories">{['PLATS', 'ENTRÉES', 'DESSERTS', 'BOISSONS'].map((label) => <button key={label} className={category === label ? 'active' : ''} onClick={() => setCategory(label)}>{label}</button>)}</div>
          <div className="rt-dishes">
            {filtered.map((dish, index) => (
              <button className={`rt-dish rt-dish-${index + 1}`} key={dish.id} onClick={() => setSelected(dish)}>
                <div className="rt-dish-media"><img src={dish.image} alt={dish.alt} /><span>0{index + 1}</span>{index === 0 && <b>MAISON</b>}</div>
                <div className="rt-dish-info"><div><small>{dish.category}</small><strong>{dish.name}</strong></div><span>{dish.price}</span></div>
              </button>
            ))}
          </div>
        </section>

        <section className="rt-service-panel">
          <div className="rt-service-copy"><span className="rt-kicker">04 / SERVICE</span><h2>ON SE RETROUVE<br /><em>À TABLE.</em></h2><p>Sur place, à emporter ou avec une commande à organiser : les services disponibles restent visibles sans mélanger la réservation avec le paiement du repas.</p></div>
          <div className="rt-service-orbit"><div className="rt-service-circle"><Sparkles size={25} /><strong>FRESH</strong><span>EVERY<br />DAY</span></div><div className="rt-service-dot rt-dot-a" /><div className="rt-service-dot rt-dot-b" /></div>
          <div className="rt-service-list"><div><span>01</span><strong>Sur place</strong><small>Tables & catégories d'emplacement</small></div><div><span>02</span><strong>À emporter</strong><small>Commande à récupérer</small></div><div><span>03</span><strong>Livraison</strong><small>Selon les options disponibles</small></div></div>
        </section>

        <section className="rt-booking" id="rt-booking">
          <div className="rt-booking-top"><span className="rt-kicker">05 / RÉSERVATION</span><span>TABLE · TEMPO</span></div>
          <div className="rt-booking-main"><div><h2>BOOK<br /><em>YOUR TABLE.</em></h2><p>Choisissez la date, l'heure, le nombre de personnes et une catégorie d'emplacement. Les frais de réservation, s'ils existent, restent distincts de la consommation.</p></div><div className="rt-booking-card"><div className="rt-field"><label>DATE</label><strong>Aujourd'hui</strong></div><div className="rt-field"><label>HEURE</label><strong>19:30</strong></div><div className="rt-field"><label>PERSONNES</label><div><button aria-label="Diminuer"><Minus size={14}/></button><strong>2</strong><button aria-label="Augmenter"><Plus size={14}/></button></div></div><button className="rt-book-btn">VÉRIFIER LES DISPONIBILITÉS <ArrowRight size={16}/></button></div></div>
        </section>

        <section className="rt-location"><div className="rt-location-map"><div className="rt-map-grid" /><span className="rt-map-pin"><MapPin size={20} /></span><span className="rt-map-label">COTONOU / AKPAKPA</span></div><div className="rt-location-copy"><span className="rt-kicker">06 / FIND US</span><h2>COME<br /><em>HUNGRY.</em></h2><div className="rt-fact"><Clock3 size={17}/><span><b>HORAIRES</b>Lun—Dim · 08:00—22:00</span></div><div className="rt-fact"><MapPin size={17}/><span><b>ADRESSE</b>{item.location}</span></div><div className="rt-fact"><MessageCircle size={17}/><span><b>CONTACT</b>Message direct via Loka</span></div></div></section>
      </main>

      <footer className="rt-footer"><span>TABLE / TEMPO</span><span>VITRINE RESTAURANT · LOKA</span><span>© 2026</span></footer>
      <StorefrontProductQuickView product={selected} open={Boolean(selected)} onClose={() => setSelected(null)} theme="restauranttempo" preview={preview} />
      {selected && <button className="rt-mobile-close" aria-label="Fermer" onClick={() => setSelected(null)}><X size={18}/></button>}
    </div>
  );
}
