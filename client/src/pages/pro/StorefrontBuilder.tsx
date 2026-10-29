import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, Globe2, Palette, Save, Sparkles } from 'lucide-react';
import { Button } from '../../components/primitives';
import { CustomerJourneyPreview } from '../../components/storefront/CustomerJourneyPreview';
import { getStorefrontTemplates, StorefrontRenderer } from '../../components/storefront/StorefrontRenderer';
import type { StorefrontTemplate, StorefrontType } from '../../components/storefront/StorefrontRenderer';
import { saveStorefront } from '../../services/storefront';
import { getStorefrontEditorData } from '../../services/storefrontPublic';
import { LogoPicker } from '../../components/media/MediaPicker';
import { getSpaces } from '../../services/professional';
import { appPath } from '../../utils/navigation';

const spaceMap: Record<StorefrontType, { label: string; backend: 'vente' | 'restauration' | 'hotel' }> = {
  boutique: { label: 'Boutique', backend: 'vente' },
  restaurant: { label: 'Restaurant', backend: 'restauration' },
  hotel: { label: 'Hôtel', backend: 'hotel' },
};

export function StorefrontBuilder() {
  const initialParams = new URLSearchParams(window.location.search);
  const initialSpaceType = initialParams.get('espaceType');
  const initialType: StorefrontType = initialSpaceType === 'restauration' ? 'restaurant' : initialSpaceType === 'hotel' ? 'hotel' : 'boutique';
  const [type, setType] = useState<StorefrontType>(initialType);
  const [selected, setSelected] = useState('boutique_minimal');
  const [accent, setAccent] = useState('#0A84FF');
  const [secondary,setSecondary]=useState('#1C1C1E');const [background,setBackground]=useState('#FFFFFF');const [spaces,setSpaces]=useState<any[]>([]);
  const [published, setPublished] = useState(false);
  const [spaceData, setSpaceData] = useState<any>(null);
  const [dataError, setDataError] = useState('');
  const [saved, setSaved] = useState(false);
  const [logo, setLogo] = useState<string[]>([]);
  const [publishError, setPublishError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const templates = useMemo(() => getStorefrontTemplates(type), [type]);
  const selectedTemplate: StorefrontTemplate = templates.find((entry) => entry.id === selected) ?? templates[0];
  const params = new URLSearchParams(window.location.search);
  const espaceId = params.get('espaceId') || '';
  const espaceType = params.get('espaceType') as 'vente' | 'restauration' | 'hotel' | null;
  useEffect(()=>{const token=window.localStorage.getItem('token');if(!token)return;getSpaces(token).then(xs=>{const valid=xs.filter((x:any)=>['vente','restauration','hotel'].includes(x.type));setSpaces(valid);if(!espaceId&&!espaceType&&valid.length){const chosen=valid.find((x:any)=>x.type==='vente')||valid[0];const t=chosen.type==='restauration'?'restaurant':chosen.type==='hotel'?'hotel':'boutique';setType(t);setSelected(getStorefrontTemplates(t)[0].id);window.history.replaceState({},'',appPath('/pro/vitrine')+'?espaceType='+encodeURIComponent(chosen.type)+'&espaceId='+encodeURIComponent(chosen.id));}}).catch(()=>setSpaces([]));},[]);
  useEffect(() => {
    const token = window.localStorage.getItem('token');
    setPublishError('');
    if (!token || !espaceId || !espaceType) { setSpaceData(null); return; }
    getStorefrontEditorData(espaceType, espaceId, token).then((data) => { setSpaceData(data); setDataError(''); const storedLogo = data.config?.configuration?.logo || data.espace?.logo || data.logo || ''; setLogo(storedLogo ? [String(storedLogo)] : []); if (data.config?.template) setSelected(data.config.template); if(data.config?.accent)setAccent(data.config.accent); if(data.config?.couleurSecondaire)setSecondary(data.config.couleurSecondaire); if(data.config?.couleurFond)setBackground(data.config.couleurFond); if (data.config?.publie) setPublished(true); }).catch((e) => setDataError(e instanceof Error ? e.message : 'Impossible de charger les données de la vitrine.'));
  }, [espaceId, espaceType]);

  function changeType(next: StorefrontType) {
    if (espaceType) return;
    setType(next);
    setSelected(getStorefrontTemplates(next)[0].id);
    setSaved(false);
  }

  async function publish() {
    const token = window.localStorage.getItem('token');
    const espaceId = params.get('espaceId');
    const espaceType = params.get('espaceType') as 'vente' | 'restauration' | 'hotel' | null;

    setPublishError('');
    if (!token || !espaceId || !espaceType) {
      setPublished(false);
      setSaved(false);
      window.alert('Ouvrez le Builder depuis un espace professionnel réel pour enregistrer ou publier une vitrine.');
      return;
    }

    setPublishing(true);
    try {
      await saveStorefront({
        espaceType,
        espaceId,
        template: selectedTemplate.id,
        accent,
        couleurSecondaire: secondary,
        couleurFond: background,
        mode: 'light',
        catalogueLayout: 'grid',
        configuration: { source: 'storefront-builder-v17', logo: logo[0] || '' },
        publie: true,
      }, token);
      setPublished(true);
      setSaved(true);
    } catch (error) {
      setPublished(false);
      setSaved(false);
      setPublishError(error instanceof Error ? error.message : 'La publication a échoué. Vérifiez votre connexion puis réessayez.');
    } finally { setPublishing(false); }
  }

  return (
    <div className="builder-page">
      <header className="builder-header">
        <div><span className="section-eyebrow">Storefront Builder</span><h1>Construisez votre vitrine</h1><p>Choisissez une structure, ajustez son identité et voyez le parcours client avec vos contenus.</p></div>
        <div className="builder-header-actions"><Button variant="secondary" onClick={()=>{if(espaceId&&espaceType){const route=espaceType==='vente'?'/boutique/':espaceType==='restauration'?'/restaurant/':'/hotel/';window.open(appPath(route+espaceId),'_blank','noopener,noreferrer');}else setPublishError("Choisissez un espace professionnel pour ouvrir son aperçu public.");}}><Eye size={17} /> Aperçu public</Button><Button onClick={publish} disabled={publishing}><Save size={17} /> {publishing ? 'Publication…' : published ? 'Publié' : 'Publier'}</Button></div>
      </header>

      {!espaceId&&spaces.length===0&&<div className="commerce-inline-state"><strong>Aucun espace à personnaliser.</strong> Créez d’abord votre boutique, restaurant ou hôtel. <a href={appPath('/mon-espace')}>Créer un espace</a></div>}
      <div className="builder-workspace">
        <aside className="builder-panel">
          <div className="builder-panel-section"><span className="builder-label">Espace</span>{spaces.length>0&&<label className="builder-space-select">Établissement<select value={espaceId} onChange={e=>{const next=spaces.find((x:any)=>x.id===e.target.value);if(!next)return;const t=next.type==='restauration'?'restaurant':next.type==='hotel'?'hotel':'boutique';window.location.href=appPath('/pro/vitrine')+'?espaceType='+encodeURIComponent(next.type)+'&espaceId='+encodeURIComponent(next.id);setType(t);}}>{spaces.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}<div className="builder-space-tabs">{(['boutique', 'restaurant', 'hotel'] as StorefrontType[]).map((item) => <button key={item} className={type === item ? 'active' : ''} disabled={Boolean(espaceType)} title={espaceType ? 'Le type est déterminé par l’établissement en cours de modification.' : undefined} onClick={() => changeType(item)}>{spaceMap[item].label}</button>)}</div>{espaceType && <p className="builder-help">Type verrouillé sur cet établissement pour éviter de publier un modèle incompatible.</p>}</div>
          <div className="builder-panel-section"><div className="builder-section-title"><span className="builder-label">Modèle</span><span>{templates.length} disponibles</span></div><p className="builder-help">La structure change réellement. Les données de votre espace restent les mêmes.</p><div className="builder-template-list"><TemplateList templates={templates} selected={selected} onSelect={setSelected} /></div></div>
          <div className="builder-panel-section"><div className="builder-section-title"><span className="builder-label">Identité</span><Palette size={16} /></div><LogoPicker token={window.localStorage.getItem('token') || undefined} value={logo} onChange={(next) => { setLogo(next); setSaved(false); }} /><div className="builder-color-row"><span>Couleur principale</span><label><input type="color" value={accent} onChange={(e) => { setAccent(e.target.value); setSaved(false); }} /><code>{accent}</code></label></div><div className="builder-color-row"><span>Couleur secondaire</span><label><input type="color" value={secondary} onChange={(e)=>{setSecondary(e.target.value);setSaved(false)}}/><code>{secondary}</code></label></div><div className="builder-color-row"><span>Fond</span><label><input type="color" value={background} onChange={(e)=>{setBackground(e.target.value);setSaved(false)}}/><code>{background}</code></label></div></div>
          <div className="builder-checklist"><div className="builder-section-title"><span className="builder-label">Publication</span><Sparkles size={16} /></div><div><Check size={15} /> Établissement ciblé</div><div className={logo.length ? 'complete' : ''}>{logo.length ? <Check size={15} /> : <Globe2 size={15} />} Logo {logo.length ? 'ajouté' : 'facultatif'}</div><div><Check size={15} /> Modèle : {selectedTemplate.label}</div><div className={published ? 'complete' : ''}>{published ? <Check size={15} /> : <Globe2 size={15} />} {published ? 'Vitrine publiée' : 'Prête à publier'}</div>{publishError && <p className="builder-publish-error" role="alert">{publishError}</p>}</div>
        </aside>

        <main className="builder-preview-area">
          <div className="builder-preview-bar"><div><strong>Aperçu réel</strong><span>{selectedTemplate.label} · {selectedTemplate.family}</span></div><span className="builder-save-state">{saved ? 'Enregistré' : 'Modifications locales'}</span></div>
          <div className="builder-preview-frame">{dataError ? <div className="builder-empty-state">{dataError}</div> : spaceData ? <StorefrontRenderer type={type} templateId={selected} preview accent={accent} data={spaceData?.espace ? { ...spaceData, espace: { ...spaceData.espace, logo: logo[0] || spaceData.espace.logo || '' } } : { ...spaceData, logo: logo[0] || spaceData?.logo || '' }} adaptiveOnly /> : <div className="builder-empty-state"><strong>Aperçu réel indisponible</strong><span>Ouvrez le Builder depuis un espace professionnel réel pour utiliser ses données.</span></div>}</div>
          <CustomerJourneyPreview type={type} />
        </main>
      </div>
    </div>
  );
}

function TemplateList({ templates, selected, onSelect }: { templates: StorefrontTemplate[]; selected: string; onSelect: (id: string) => void }) {
  return <>{templates.map((template) => <button key={template.id} className={`builder-template-row ${template.id === selected ? 'active' : ''}`} onClick={() => onSelect(template.id)}><span className="builder-template-mark" /><span><strong>{template.label}</strong><small>{template.minimumPlan === 'starter' ? 'Inclus Starter' : `Plan ${template.minimumPlan}`}</small></span></button>)}</>;
}
