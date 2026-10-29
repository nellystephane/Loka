import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Layers3, Plus, Sparkles, Tags, X } from 'lucide-react';
import { Button } from '../../components/primitives';
import { MediaPicker } from '../../components/media/MediaPicker';
import { VideoPicker } from '../../components/media/VideoPicker';
import { createBoutiqueCategory, createProduct, getBoutiqueCategories, getBoutiqueCollections, getProductSchemaSuggestions, type ProduitPayload } from '../../services/catalogue';
import { getSpaces } from '../../services/professional';
import { API_BASE } from '../../services/apiConfig';

type Category = { _id: string; nom: string };
type Collection = { _id: string; nom: string; produits?: { _id: string; nom: string }[] };

const activityTypes = ['Mode', 'Chaussures', 'Alimentation', 'Beauté & Hygiène', 'Électronique', 'Maison & Décoration', 'Bijoux & accessoires', 'Autre'];

export function BoutiqueCatalogManager() {
  const token = window.localStorage.getItem('token') || '';
  const [step, setStep] = useState(1);
  const [spaces,setSpaces]=useState<any[]>([]);const [spaceId,setSpaceId]=useState('');const [menuName,setMenuName]=useState('');const [menuDescription,setMenuDescription]=useState('');const [menuCategory,setMenuCategory]=useState('');const [menuPrice,setMenuPrice]=useState('');const [menuPhotos,setMenuPhotos]=useState<string[]>([]);const [menuBusy,setMenuBusy]=useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [form, setForm] = useState<ProduitPayload>({ nom: '', description: '', categorie: '', prix: 0, quantiteDisponible: 0, variantes: [], attributs: {}, tags: [], collections: [], livraisonPossible: true });
  const [productVideo,setProductVideo]=useState('');
  const [variantName, setVariantName] = useState('');
  const [variantValues, setVariantValues] = useState('');
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;
    getSpaces(token).then(xs=>{setSpaces(xs);const wanted=new URLSearchParams(location.search).get('espaceId');const chosen=xs.find((x:any)=>x.id===wanted)||xs.find((x:any)=>x.type==='vente')||xs[0];if(chosen)setSpaceId(chosen.id);}).catch(()=>undefined);
    Promise.all([getBoutiqueCategories(token), getBoutiqueCollections(token)]).then(([cats, cols]) => { setCategories(cats); setCollections(cols); }).catch(() => undefined);
  }, [token]);
  const activeSpace=spaces.find((x:any)=>x.id===spaceId);
  async function saveSpaceItem(){setError('');if(!token||!activeSpace)return;if(!menuName.trim()||!menuCategory||!menuPrice.trim()){setError('Renseignez le nom, la catégorie et le prix.');return;}setMenuBusy(true);try{const hotel=activeSpace.type==='hotel';const payload=hotel?{nom:menuName.trim(),type:menuCategory,typeNormalise:menuCategory,description:menuDescription,prixParNuit:Number(menuPrice),photos:menuPhotos}:{nom:menuName.trim(),categorie:menuCategory,description:menuDescription,prix:Number(menuPrice),photos:menuPhotos,disponible:true};const endpoint=hotel?'/api/chambres':'/api/plats';const response=await fetch(API_BASE+endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.message||'Impossible d’enregistrer cet élément.');setSaved(true);setMenuName('');setMenuDescription('');setMenuPrice('');setMenuPhotos([]);setError('');}catch(e){setError(e instanceof Error?e.message:'Impossible d’enregistrer cet élément.')}finally{setMenuBusy(false)}}

  useEffect(() => {
    if (!token || !form.categorie) { setSuggestions([]); return; }
    getProductSchemaSuggestions(form.categorie, token).then((data) => setSuggestions(data.suggestions || [])).catch(() => setSuggestions([]));
  }, [form.categorie, token]);

  const completion = useMemo(() => {
    let score = 0;
    if (form.nom.trim()) score += 25;
    if (form.description.trim()) score += 20;
    if (form.categorie) score += 15;
    if (form.prix > 0) score += 20;
    if (form.quantiteDisponible >= 0) score += 10;
    if (form.photos?.length) score += 5;
    if (form.collections?.length) score += 5;
    if (Object.keys(form.attributs || {}).length) score += 5;
    return Math.min(score, 100);
  }, [form]);

  function addVariant() {
    if (!variantName.trim() || !variantValues.trim()) return;
    setForm((current) => ({ ...current, variantes: [...(current.variantes || []), { nom: variantName.trim(), valeurs: variantValues.split(',').map((value) => value.trim()).filter(Boolean) }] }));
    setVariantName(''); setVariantValues('');
  }

  async function save() {
    setError('');
    if (!form.nom || !form.description || !form.categorie || !form.prix) { setError('Complétez les informations essentielles avant de publier.'); setStep(1); return; }
    if (!token) { setSaved(true); return; }
    try {
      const category = categories.find((item) => item.nom === form.categorie);
      const payload = { ...form, video: productVideo, categorieId: category?._id || null, attributs: { ...(form.attributs || {}), ...Object.fromEntries(Object.entries(attributeValues).filter(([, value]) => value.trim())) } };
      await createProduct(payload, token);
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de publier le produit.'); }
  }

  async function createCategory() {
    const nom = window.prompt('Nom de la catégorie');
    if (!nom?.trim() || !token) return;
    try { const created = await createBoutiqueCategory({ nom: nom.trim() }, token); setCategories((items) => [...items, created]); setForm((current) => ({ ...current, categorie: created.nom })); } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de créer la catégorie.'); }
  }

  if(!token)return <main className="professional-page"><h2>Connectez-vous pour gérer votre catalogue</h2><a className="button button-primary" href="/connexion">Se connecter</a></main>;
  if(spaces.length===0)return <main className="professional-page"><header className="professional-page-head"><div><span className="section-eyebrow">Catalogue métier</span><h2>Aucun espace professionnel détecté</h2><p>Créez d’abord une boutique, un restaurant ou un hébergement. Les outils seront ensuite adaptés à votre activité.</p></div></header><a className="button button-primary" href="/mon-espace">Créer un espace</a></main>;
  if(activeSpace&&activeSpace.type!=='vente')return <main className="professional-page"><header className="professional-page-head"><div><span className="section-eyebrow">Catalogue adapté à votre activité</span><h2>{activeSpace.type==='restauration'?'Gérer la carte du restaurant':'Gérer les chambres et hébergements'}</h2><p>{activeSpace.name} · les éléments ajoutés sont enregistrés sur votre activité.</p></div><a className="button button-secondary" href={activeSpace.type==='restauration'?'/pro/reservations':'/pro/hotel'}>{activeSpace.type==='restauration'?'Gérer les réservations':'Ouvrir le tableau de bord'}</a></header><section className="professional-panel"><label>Changer d’espace<select value={spaceId} onChange={e=>setSpaceId(e.target.value)}>{spaces.map((x:any)=><option key={x.id} value={x.id}>{x.name} · {x.type==='vente'?'Boutique':x.type==='restauration'?'Restaurant':x.type==='hotel'?'Hôtel':x.type==='livraison'?'Livreur':'Agence'}</option>)}</select></label><div className="catalog-form-section"><h3>{activeSpace.type==='restauration'?'Ajouter un plat à la carte':'Ajouter un type de chambre'}</h3><MediaPicker token={token} value={menuPhotos} onChange={setMenuPhotos} maxFiles={6} label={activeSpace.type==='restauration'?'Photos du plat':'Photos de la chambre'}/><div className="catalog-two"><label>Nom<input value={menuName} onChange={e=>setMenuName(e.target.value)} placeholder={activeSpace.type==='restauration'?'Ex. Poulet braisé':'Ex. Chambre standard'}/></label><label>{activeSpace.type==='restauration'?'Prix (FCFA)':'Prix par nuit (FCFA)'}<input type="number" min="0" value={menuPrice} onChange={e=>setMenuPrice(e.target.value)} placeholder="Ex. 5000"/></label></div><label>{activeSpace.type==='restauration'?'Catégorie du plat':'Type de chambre'}<input value={menuCategory} onChange={e=>setMenuCategory(e.target.value)} placeholder={activeSpace.type==='restauration'?'Ex. Plats principaux':'Ex. Standard, suite, familiale'}/></label><label>Description<textarea value={menuDescription} onChange={e=>setMenuDescription(e.target.value)} rows={3} placeholder="Détails utiles pour vos clients"/></label>{error&&<div className="commerce-inline-state error" role="alert">{error}</div>}<button className="button button-primary" disabled={menuBusy} onClick={()=>void saveSpaceItem()}>{menuBusy?'Enregistrement…':activeSpace.type==='restauration'?'Ajouter à la carte':'Ajouter à l’hébergement'}</button></div></section></main>;
  return (
    <div className="catalog-manager-page">
      <header className="catalog-manager-header">
        <div><span className="section-eyebrow">Catalogue Boutique</span><h1>Ajoutez un produit sans remplir un formulaire interminable.</h1><p>Les informations essentielles sont demandées d'abord. Les variantes et attributs apparaissent seulement lorsqu'ils sont utiles.</p></div>
        <div className="catalog-completion"><strong>{completion}%</strong><span>fiche enrichie</span><label className="catalog-space-select">Espace<select value={spaceId} onChange={e=>setSpaceId(e.target.value)}>{spaces.map((x:any)=><option key={x.id} value={x.id}>{x.name} · {x.type==='vente'?'Boutique':x.type==='restauration'?'Restaurant':x.type==='hotel'?'Hôtel':x.type==='livraison'?'Livreur':'Agence'}</option>)}</select></label></div>
      </header>

      <div className="catalog-manager-grid">
        <main className="catalog-form-card">
          <div className="catalog-stepper">{['Essentiel', 'Variantes', 'Caractéristiques', 'Organisation'].map((label, index) => <button key={label} className={step === index + 1 ? 'active' : ''} onClick={() => setStep(index + 1)}><span>{index + 1}</span>{label}</button>)}</div>

          {step === 1 && <section className="catalog-form-section"><h2>Commençons par le produit</h2><p className="catalog-muted">Ces informations suffisent pour mettre un premier article en ligne.</p><MediaPicker token={token} value={form.photos || []} onChange={(photos) => setForm((current) => ({ ...current, photos }))} maxFiles={8} label="Photos du produit" help="Choisissez depuis la galerie du téléphone ou les fichiers de votre appareil." /><VideoPicker token={token} value={productVideo} onChange={setProductVideo} label="Vidéo de présentation (facultatif)"/><div className="catalog-two"><label>Nom du produit<input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex. Robe Maya" /></label><label>Prix<input type="number" min="0" value={form.prix || ''} onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })} placeholder="25000" /></label></div><label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Présentez simplement le produit à vos clients." /></label><div className="catalog-two"><label>Type de produit<select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}><option value="">Choisir</option>{activityTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label>Stock<input type="number" min="0" value={form.quantiteDisponible} onChange={(e) => setForm({ ...form, quantiteDisponible: Number(e.target.value) })} /></label></div></section>}

          {step === 2 && <section className="catalog-form-section"><h2>Le produit a-t-il des variantes ?</h2><p className="catalog-muted">Ajoutez uniquement ce qui existe réellement : taille, couleur, format, capacité...</p><div className="catalog-two"><label>Nom de l'option<input value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="Couleur" /></label><label>Valeurs<input value={variantValues} onChange={(e) => setVariantValues(e.target.value)} placeholder="Noir, Beige, Rouge" /></label></div><Button onClick={addVariant}><Plus size={16} /> Ajouter cette option</Button><div className="catalog-chip-list">{(form.variantes || []).map((variant, index) => <div className="catalog-chip-row" key={`${variant.nom}-${index}`}><strong>{variant.nom}</strong><span>{variant.valeurs.join(' · ')}</span><button onClick={() => setForm({ ...form, variantes: form.variantes?.filter((_, i) => i !== index) })}><X size={15} /></button></div>)}</div></section>}

          {step === 3 && <section className="catalog-form-section"><h2>Quelques informations peuvent enrichir la fiche</h2><p className="catalog-muted">Elles dépendent du type de produit. Rien n'est obligatoire ici.</p>{suggestions.length === 0 ? <div className="catalog-smart-empty"><Sparkles size={18} /><span>Aucun attribut particulier n'est nécessaire pour ce type. Vous pouvez continuer.</span></div> : suggestions.map((suggestion) => <label key={suggestion}>{suggestion}<input value={attributeValues[suggestion] || ''} onChange={(e) => setAttributeValues({ ...attributeValues, [suggestion]: e.target.value })} placeholder="Facultatif" /></label>)}<label>Tags<input value={(form.tags || []).join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} placeholder="nouveau, été, sélection" /></label></section>}

          {step === 4 && <section className="catalog-form-section"><h2>Organisons votre catalogue</h2><p className="catalog-muted">Les catégories et collections servent ensuite automatiquement aux templates.</p><div className="catalog-section-heading"><div><Tags size={18} /><strong>Catégorie</strong></div><button onClick={createCategory}>+ Créer</button></div><div className="catalog-choice-grid">{categories.map((category) => <button key={category._id} className={form.categorie === category.nom ? 'selected' : ''} onClick={() => setForm({ ...form, categorie: category.nom })}>{category.nom}</button>)}</div><div className="catalog-section-heading"><div><Layers3 size={18} /><strong>Collection</strong></div><span>Facultatif</span></div><div className="catalog-choice-grid">{collections.map((collection) => <button key={collection._id} className={form.collections?.includes(collection._id) ? 'selected' : ''} onClick={() => setForm({ ...form, collections: form.collections?.includes(collection._id) ? form.collections.filter((id) => id !== collection._id) : [...(form.collections || []), collection._id] })}>{collection.nom}</button>)}{collections.length === 0 && <div className="catalog-smart-empty"><Sparkles size={18} />Les collections pourront être créées plus tard. Les « nouvelles arrivées » seront automatiques.</div>}</div></section>}

          {error && <div className="catalog-error">{error}</div>}
          <footer className="catalog-form-footer"><button className="catalog-secondary" disabled={step === 1} onClick={() => setStep((value) => value - 1)}>Retour</button>{step < 4 ? <Button onClick={() => setStep((value) => value + 1)}><ChevronRight size={17} /> Continuer</Button> : <Button onClick={save}><Sparkles size={17} /> {saved ? 'Produit enregistré' : 'Mettre en ligne'}</Button>}</footer>
        </main>

        <aside className="catalog-system-card"><span className="section-eyebrow">Ce que Loka fait ensuite</span><h2>Vous fournissez la matière. La vitrine fait le reste.</h2><div className="catalog-system-flow"><div><b>01</b><span>Produit</span></div><div><b>02</b><span>Catégorie</span></div><div><b>03</b><span>Collection</span></div><div><b>04</b><span>Template</span></div><div><b>05</b><span>Composition</span></div></div><p>« Nouvelles arrivées », produits populaires et sections compatibles peuvent être calculés à partir des données réelles. Le vendeur n'a pas à remplir chaque emplacement du template.</p></aside>
      </div>
    </div>
  );
}
