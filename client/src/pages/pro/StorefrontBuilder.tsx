import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, Globe2, Palette, Save, Sparkles } from 'lucide-react';
import { Button } from '../../components/primitives';
import { CustomerJourneyPreview } from '../../components/storefront/CustomerJourneyPreview';
import { getStorefrontTemplates, StorefrontRenderer } from '../../components/storefront/StorefrontRenderer';
import type { StorefrontTemplate, StorefrontType } from '../../components/storefront/StorefrontRenderer';
import { saveStorefront } from '../../services/storefront';
import { getStorefrontEditorData } from '../../services/storefrontPublic';
import { getStorefrontTemplates as fetchStorefrontTemplates } from '../../services/storefront';
import { trackEvent } from '../../services/analytics';

const spaceMap: Record<StorefrontType, { label: string; backend: 'vente' | 'restauration' | 'hotel' }> = {
  boutique: { label: 'Boutique', backend: 'vente' },
  restaurant: { label: 'Restaurant', backend: 'restauration' },
  hotel: { label: 'Hôtel', backend: 'hotel' },
};

export function StorefrontBuilder() {
  const params = new URLSearchParams(window.location.search);
  const espaceId = params.get('espaceId') || '';
  const espaceType = params.get('espaceType') as 'vente' | 'restauration' | 'hotel' | null;
  const initialType: StorefrontType = espaceType === 'restauration' ? 'restaurant' : espaceType === 'hotel' ? 'hotel' : 'boutique';
  const [type, setType] = useState<StorefrontType>(initialType);
  const [selected, setSelected] = useState(() => getStorefrontTemplates(initialType)[0]?.id || 'boutique_minimal');
  const [accent, setAccent] = useState('#0A84FF');
  const [published, setPublished] = useState(false);
  const [spaceData, setSpaceData] = useState<any>(null);
  const [dataError, setDataError] = useState('');
  const [saved, setSaved] = useState(false);
  const [availableTemplateIds, setAvailableTemplateIds] = useState<string[]>([]);
  const [planName, setPlanName] = useState('');
  const [saving, setSaving] = useState(false);
  const templates = useMemo(() => getStorefrontTemplates(type), [type]);
  const selectedTemplate: StorefrontTemplate = templates.find((entry) => entry.id === selected) ?? templates[0];
  useEffect(() => {
    const token = window.localStorage.getItem('token');
    if (!token || !espaceId || !espaceType) { setSpaceData(null); return; }
    Promise.all([getStorefrontEditorData(espaceType, espaceId, token), fetchStorefrontTemplates(espaceType, espaceId, token)])
      .then(([data, entitlements]) => {
        setSpaceData(data); setDataError(''); setPlanName(String(entitlements.plan || ''));
        const ids = Array.isArray(entitlements.templates) ? entitlements.templates.map((item: any) => typeof item === 'string' ? item : item.id).filter(Boolean) : [];
        setAvailableTemplateIds(ids);
        if (data.config?.template) setSelected(data.config.template);
        if (data.config?.publie) setPublished(true);
        if (data.config?.accent) setAccent(data.config.accent);
      })
      .catch((e) => setDataError(e instanceof Error ? e.message : 'Impossible de charger les données de la vitrine.'));
  }, [espaceId, espaceType]);

  const espace = spaceData?.espace || {};
  const nomOk = Boolean(String(espace.nom || '').trim());
  const descriptionOk = Boolean(String(espace.description || '').trim());
  const villeOk = Boolean(String(espace.localisation?.ville || '').trim());
  const essentialsOk = nomOk && descriptionOk && villeOk;
  const contentCount = type === 'boutique' ? (espace.produits || []).filter((item: any) => item.statut === 'disponible' && Number(item.quantiteDisponible) > 0).length
    : type === 'restaurant' ? (espace.plats || []).filter((item: any) => item.disponible !== false).length
    : (espace.hebergements || []).filter((item: any) => item.disponible !== false).length;
  const contentOk = contentCount > 0;
  const templateOk = !espaceType || availableTemplateIds.includes(selectedTemplate?.id || selected);
  const checklistReady = Boolean(espaceId && espaceType && essentialsOk && contentOk && templateOk && !dataError);

  function changeType(next: StorefrontType) {
    if (espaceType && next !== initialType) return;
    setType(next);
    setSelected(getStorefrontTemplates(next)[0].id);
    setSaved(false);
    setPublished(false);
  }

  async function publish() {
    const token = window.localStorage.getItem('token');
    const espaceId = params.get('espaceId');
    const espaceType = params.get('espaceType') as 'vente' | 'restauration' | 'hotel' | null;

    if (!token || !espaceId || !espaceType) {
      setDataError('Sélectionnez une activité réelle depuis la Vue d’ensemble avant d’enregistrer ou publier sa vitrine.');
      setPublished(false);
      setSaved(false);
      return;
    }

    if (!checklistReady) { setDataError('Complétez les informations essentielles, ajoutez au moins un contenu disponible et choisissez un modèle autorisé par votre abonnement avant de publier.'); setPublished(false); return; }

    setSaving(true);
    setDataError('');
    try {
      await saveStorefront({
        espaceType,
        espaceId,
        template: selectedTemplate.id,
        accent,
        couleurSecondaire: '#1C1C1E',
        couleurFond: '#FFFFFF',
        mode: 'light',
        catalogueLayout: 'grid',
        configuration: { source: 'storefront-builder-v16' },
        publie: true,
      }, token);
      setPublished(true);
      setSaved(true);
    } catch (error) {
      setPublished(false);
      setSaved(false);
      setDataError(error instanceof Error ? error.message : 'La vitrine n’a pas pu être enregistrée. Réessayez.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="builder-page">
      <header className="builder-header">
        <div><span className="section-eyebrow">Storefront Builder</span><h1>Construisez votre vitrine</h1><p>Choisissez une structure, ajustez son identité et voyez le parcours client avec vos contenus.</p></div>
        <div className="builder-header-actions"><Button variant="secondary" disabled={!espaceId} onClick={() => window.open(type === 'boutique' ? `/boutique/${encodeURIComponent(espaceId)}` : type === 'restaurant' ? `/restaurant/${encodeURIComponent(espaceId)}` : `/hotel/${encodeURIComponent(espaceId)}`, '_blank', 'noopener,noreferrer')}><Eye size={17} /> Aperçu client</Button><Button onClick={publish} disabled={saving || !espaceId || !espaceType || !checklistReady}><Save size={17} /> {saving ? 'Enregistrement…' : published ? 'Publié' : 'Publier'}</Button></div>
      </header>

      <div className="builder-workspace">
        <aside className="builder-panel">
          <div className="builder-panel-section"><span className="builder-label">Espace</span><div className="builder-space-tabs">{(['boutique', 'restaurant', 'hotel'] as StorefrontType[]).map((item) => <button key={item} className={type === item ? 'active' : ''} onClick={() => changeType(item)} disabled={Boolean(espaceType && item !== initialType)} title={espaceType && item !== initialType ? 'Le type dépend de l’activité sélectionnée' : undefined}>{spaceMap[item].label}</button>)}</div></div>
          <div className="builder-panel-section"><div className="builder-section-title"><span className="builder-label">Modèle</span><span>{templates.length} disponibles</span></div><p className="builder-help">La structure change réellement. Les données de votre espace restent les mêmes.</p><div className="builder-template-list"><TemplateList templates={templates} selected={selected} onSelect={(id) => { setSelected(id); setSaved(false); trackEvent('template_preview', 'storefront_template', id, { espaceType, espaceId }); }} availableTemplateIds={availableTemplateIds} /></div></div>
          <div className="builder-panel-section"><div className="builder-section-title"><span className="builder-label">Identité</span><Palette size={16} /></div><div className="builder-color-row"><span>Accent</span><label><input type="color" value={accent} onChange={(e) => { setAccent(e.target.value); setSaved(false); }} /><code>{accent}</code></label></div></div>
          <div className="builder-checklist"><div className="builder-section-title"><span className="builder-label">Publication</span><Sparkles size={16} /></div><div className={essentialsOk ? 'complete' : 'incomplete'}>{essentialsOk ? <Check size={15} /> : <Globe2 size={15} />} Informations essentielles {essentialsOk ? 'complètes' : '(nom, description, ville)'}</div><div className={contentOk ? 'complete' : 'incomplete'}>{contentOk ? <Check size={15} /> : <Globe2 size={15} />} Contenu disponible {contentOk ? `(${contentCount})` : '(ajoutez un produit, plat ou hébergement)'}</div><div className={templateOk ? 'complete' : 'incomplete'}>{templateOk ? <Check size={15} /> : <Globe2 size={15} />} Modèle {templateOk ? 'autorisé' : 'non inclus dans le plan'}</div><div className={published ? 'complete' : checklistReady ? 'ready' : 'incomplete'}>{published ? <Check size={15} /> : <Globe2 size={15} />} {published ? 'Vitrine publiée' : checklistReady ? 'Prête à publier' : 'Publication bloquée'}</div>{planName && <small>Plan actif : {planName}</small>}</div>
        </aside>

        <main className="builder-preview-area">
          <div className="builder-preview-bar"><div><strong>Aperçu client</strong><span>{selectedTemplate.label} · {selectedTemplate.family}</span></div><span className="builder-save-state">{saved ? 'Enregistré' : 'Modifications non enregistrées'}</span></div>
          <div className="builder-preview-frame">{dataError ? <div className="builder-empty-state">{dataError}</div> : spaceData ? <StorefrontRenderer type={type} templateId={selected} preview accent={accent} data={spaceData} adaptiveOnly /> : <div className="builder-empty-state"><strong>Aperçu réel indisponible</strong><span>Ouvrez le Builder depuis un espace professionnel réel pour utiliser ses données.</span></div>}</div>
          <CustomerJourneyPreview type={type} />
        </main>
      </div>
    </div>
  );
}

function TemplateList({ templates, selected, onSelect, availableTemplateIds }: { templates: StorefrontTemplate[]; selected: string; onSelect: (id: string) => void; availableTemplateIds: string[] }) {
  return <>{templates.map((template) => { const locked = availableTemplateIds.length > 0 && !availableTemplateIds.includes(template.id); return <button key={template.id} type="button" disabled={locked} className={`builder-template-row ${template.id === selected ? 'active' : ''} ${locked ? 'locked' : ''}`} onClick={() => onSelect(template.id)}><span className="builder-template-mark" /><span><strong>{template.label}</strong><small>{locked ? `Verrouillé · plan ${template.minimumPlan}` : template.minimumPlan === 'starter' ? 'Inclus Starter' : `Plan ${template.minimumPlan}`}</small></span></button>; })}</>;
}
