import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, CalendarDays, Clock3, MapPin, MessageCircle, Plus, Sparkles, Utensils, X } from 'lucide-react';
import { publicItems } from '../../data/demo';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';

export function RestaurantEditorialDiningTemplate({ preview = false, accent = '#FF4D2E' }: { preview?: boolean; accent?: string }) {
  const item = publicItems.restaurant;
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const [category, setCategory] = useState('PLATS');

  const dishes: StorefrontProduct[] = useMemo(() => [
    { id: 'RED-01', name: 'Mafé signature', category: 'PLATS', price: '8 500 FCFA', image: item.media[1].src, alt: 'Plat signature', description: 'Une interprétation généreuse de la maison, préparée selon le service du jour.', colors: [accent, '#111111'], sizes: ['Simple', 'Double'], details: [{ label: 'Disponibilité', value: 'Aujourd’hui' }, { label: 'Service', value: 'Sur place / à emporter' }, { label: 'Épicé', value: 'Sur demande' }], ingredients: ['Arachide', 'Légumes du jour', 'Protéine au choix'] },
    { id: 'RED-02', name: 'Poisson braisé', category: 'PLATS', price: '10 000 FCFA', image: item.media[0].src, alt: 'Poisson braisé', description: 'Poisson préparé à la commande avec accompagnement maison.', colors: [accent, '#F3B23C'], sizes: ['1 personne', '2 personnes'], details: [{ label: 'Préparation', value: 'À la commande' }, { label: 'Service', value: 'Sur place / à emporter' }, { label: 'Allergènes', value: 'À préciser' }], ingredients: ['Poisson', 'Herbes fraîches', 'Accompagnement maison'] },
    { id: 'RED-03', name: 'Bowl marché', category: 'PLATS', price: '7 000 FCFA', image: item.media[1].src, alt: 'Bowl du marché', description: 'Une composition fraîche qui évolue avec les produits disponibles.', colors: [accent, '#6D7A6E'], sizes: ['Normal', 'Grand'], details: [{ label: 'Disponibilité', value: 'Selon marché' }, { label: 'Préparation', value: 'Rapide' }, { label: 'Option', value: 'Végétarienne' }], ingredients: ['Céréale', 'Légumes', 'Sauce maison'] },
    { id: 'RED-04', name: 'Jus bissap', category: 'BOISSONS', price: '2 000 FCFA', image: item.media[0].src, alt: 'Boisson maison', description: 'Boisson fraîche maison disponible selon le service du jour.', colors: [accent, '#8D3151'], sizes: ['33 cl', '50 cl'], details: [{ label: 'Service', value: 'Frais' }, { label: 'Disponibilité', value: 'Aujourd’hui' }, { label: 'Format', value: 'À emporter' }], ingredients: ['Bissap', 'Citron', 'Sucre'] },
  ], [accent, item.media]);

  const categories = ['PLATS', 'ENTRÉES', 'DESSERTS', 'BOISSONS'];
  const filtered = category === 'PLATS' ? dishes : dishes.filter((dish) => dish.category === category);

  return (
    <div className="restaurant-editorial-dining" style={{ '--red-accent': accent || '#FF4D2E' } as React.CSSProperties}>
      <header className="red-nav">
        <a href="#red-top" className="red-wordmark"><span>CM</span><strong>CHEZ MARCEL</strong></a>
        <nav><a href="#red-menu">MENU</a><a href="#red-story">LA MAISON</a><a href="#red-reserve">RÉSERVER</a></nav>
        <a className="red-contact" href={preview ? '#red-contact' : '/messages'}><MessageCircle size={15} /> <span>CONTACTER</span></a>
      </header>

      <main>
        <section className="red-hero" id="red-top">
          <div className="red-hero-number">01 — RESTAURANT / COTONOU</div>
          <div className="red-hero-copy">
            <span className="red-kicker">CUISINE LOCALE · TABLE VIVANTE</span>
            <h1>UNE<br /><i>TABLE</i><br />QUI RESTE.</h1>
            <p>{item.description}</p>
            <div className="red-hero-actions"><a href="#red-menu">EXPLORER LA CARTE <ArrowDownRight size={17} /></a><a href="#red-reserve" className="red-text-link">RÉSERVER</a></div>
          </div>
          <div className="red-hero-image"><img src={item.media[1].src} alt="Cuisine de Chez Marcel" /><div className="red-image-caption"><span>01 / 03</span><strong>CUISINE<br />DU JOUR</strong></div></div>
          <div className="red-hero-side">MAISON · LOCAL · PARTAGÉ</div>
        </section>

        <section className="red-intro" id="red-story">
          <div className="red-section-index">02</div>
          <div className="red-intro-title"><span className="red-kicker">LA MAISON</span><h2>Le goût<br /><i>avant le décor.</i></h2></div>
          <div className="red-intro-copy"><p>Une vitrine éditoriale laisse respirer l'identité du restaurant avant de faire entrer le client dans la carte.</p><p className="red-small">L'histoire, les spécialités, l'ambiance, les horaires et les services apparaissent uniquement lorsqu'ils existent dans les données du restaurant.</p></div>
        </section>

        <section className="red-feature" aria-label="Spécialité du restaurant">
          <div className="red-feature-media"><img src={item.media[0].src} alt="Spécialité de la maison" /><span>SPÉCIALITÉ</span></div>
          <div className="red-feature-copy"><span className="red-kicker">03 / SIGNATURE</span><h2>Le plat<br /><i>du moment.</i></h2><p>Une mise en avant peut venir d'un plat, d'une formule ou d'une spécialité renseignée par le restaurant. Elle ne remplace jamais la carte complète.</p><button onClick={() => setSelected(dishes[0])}>VOIR LE PLAT <ArrowRight size={16} /></button></div>
        </section>

        <section className="red-menu" id="red-menu">
          <div className="red-menu-head"><div><span className="red-kicker">04 / LA CARTE</span><h2>À LA <i>TABLE.</i></h2></div><span className="red-menu-meta">Mise à jour par le restaurant</span></div>
          <div className="red-categories">{categories.map((label) => <button key={label} className={category === label ? 'active' : ''} onClick={() => setCategory(label)}>{label}</button>)}</div>
          <div className="red-menu-list">{filtered.map((dish, index) => <button key={dish.id} className="red-menu-row" onClick={() => setSelected(dish)}><span className="red-menu-index">0{index + 1}</span><span className="red-menu-thumb"><img src={dish.image} alt={dish.alt} /></span><span className="red-menu-name"><small>{dish.category}</small><strong>{dish.name}</strong></span><span className="red-menu-desc">{dish.description}</span><strong className="red-menu-price">{dish.price}</strong><ArrowRight size={17} className="red-menu-arrow" /></button>)}</div>
        </section>

        <section className="red-service">
          <div className="red-service-stamp"><Utensils size={20} /><span>SERVICE<br />DU JOUR</span></div>
          <div><span className="red-kicker">05 / VOTRE FAÇON DE COMMANDER</span><h2>Sur place.<br /><i>À emporter.</i><br />Livré.</h2></div>
          <div className="red-service-options"><div><span>01</span><strong>Sur place</strong><small>Profiter de la table et de l'ambiance.</small></div><div><span>02</span><strong>À emporter</strong><small>Commander puis récupérer au restaurant.</small></div><div><span>03</span><strong>Livraison</strong><small>Selon le service du restaurant ou un livreur Loka.</small></div></div>
        </section>

        <section className="red-reserve" id="red-reserve">
          <div className="red-reserve-copy"><span className="red-kicker">06 / RÉSERVATION</span><h2>Votre table<br /><i>vous attend.</i></h2><p>La réservation reste une expérience distincte de la commande. Le client choisit catégorie, date, heure et nombre de personnes avant de confirmer.</p></div>
          <div className="red-reserve-card"><div><CalendarDays size={18}/><span><small>DATE</small><strong>Aujourd'hui</strong></span></div><div><Clock3 size={18}/><span><small>HEURE</small><strong>19:30</strong></span></div><div><Utensils size={18}/><span><small>EMPLACEMENT</small><strong>Standard</strong></span></div><a href="/restaurant/chez-marcel/reserver">VÉRIFIER LES DISPONIBILITÉS <ArrowRight size={16}/></a></div>
        </section>

        <section className="red-contact-section" id="red-contact"><div className="red-contact-main"><span className="red-kicker">07 / LA MAISON</span><h2>Une question<br /><i>avant de venir ?</i></h2><p>Écrivez directement au restaurant dans la messagerie intégrée de Loka.</p><a href={preview ? '#red-top' : '/messages'}><MessageCircle size={17} /> ÉCRIRE AU RESTAURANT</a></div><div className="red-contact-facts"><div><MapPin size={18}/><span><small>ADRESSE</small><strong>{item.location}</strong></span></div><div><Clock3 size={18}/><span><small>HORAIRES</small><strong>Lun—Dim · 08:00—22:00</strong></span></div><div><Sparkles size={18}/><span><small>STATUT</small><strong>Ouvert aujourd'hui</strong></span></div></div></section>
      </main>

      <footer className="red-footer"><strong>CHEZ MARCEL</strong><span>VITRINE RESTAURANT · LOKA</span><span>© 2026</span></footer>
      <StorefrontProductQuickView product={selected} open={Boolean(selected)} onClose={() => setSelected(null)} theme="restauranttempo" preview={preview} />
      {selected && <button className="red-close" aria-label="Fermer" onClick={() => setSelected(null)}><X size={18} /></button>}
      {!preview && <a className="red-mobile-action" href="/messages"><MessageCircle size={17} /> Contacter</a>}
    </div>
  );
}
