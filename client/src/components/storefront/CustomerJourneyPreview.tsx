import { ArrowRight, MessageCircle, ShoppingBag, Star } from 'lucide-react';

export function CustomerJourneyPreview({ type }: { type: 'boutique' | 'restaurant' | 'hotel' }) {
  const action = type === 'restaurant' ? 'Réserver une table' : type === 'hotel' ? 'Voir les chambres' : 'Voir le catalogue';
  return (
    <section className="journey-preview">
      <div className="journey-preview-head"><div><span className="section-eyebrow">Parcours client</span><h3>Ce que votre visiteur verra</h3></div><span className="journey-preview-live">Aperçu interactif</span></div>
      <div className="journey-steps">
        <div><ShoppingBag size={17} /><span>Découvre</span></div><ArrowRight size={15} /><div><MessageCircle size={17} /><span>Contacte</span></div><ArrowRight size={15} /><div><span className="journey-action-dot">→</span><span>{action}</span></div><ArrowRight size={15} /><div><Star size={17} /><span>Évalue</span></div>
      </div>
    </section>
  );
}
