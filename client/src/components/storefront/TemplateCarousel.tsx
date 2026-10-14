import { Check, Lock } from 'lucide-react';
import type { StorefrontTemplate } from './StorefrontRenderer';

export function TemplateCarousel({
  templates,
  selected,
  onSelect,
}: {
  templates: StorefrontTemplate[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="template-carousel" aria-label="Choisir un modèle de vitrine">
      {templates.map((template) => {
        const active = template.id === selected;
        const locked = template.minimumPlan !== 'starter';
        return (
          <button key={template.id} className={`template-card ${active ? 'is-selected' : ''}`} onClick={() => onSelect(template.id)}>
            <div className="template-card-visual"><span>{template.family}</span><strong>{template.label}</strong>{locked ? <Lock size={15} /> : null}</div>
            <div className="template-card-body"><strong>{template.label}</strong><small>{template.description}</small><span className="template-plan">{locked ? `Plan ${template.minimumPlan}` : <><Check size={13} /> Inclus</>}</span></div>
          </button>
        );
      })}
    </div>
  );
}
