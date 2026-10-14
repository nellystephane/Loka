import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, MapPin, RefreshCw, Route, Truck } from 'lucide-react';
import { trackEvent } from '../../services/analytics';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
type DeliveryRequest = { _id: string; sourceType: string; reference: string; ville: string; quartier: string; tarif: number };
type Candidate = { utilisateurId: string; nom: string; telephone: string; transport: string; zones: string[] };
type Stop = { _id?: string; type: 'pickup' | 'dropoff'; libelle: string; adresse: { ville: string; quartier: string; details: string }; montantAlloue: number; ordre?: number; statut?: string; preuve?: { type?: string; reference?: string; note?: string; valideeLe?: string } };
type Mission = { _id: string; createur?: string; statut: string; montantTotal: number; partageFrais: string; livreur?: string | null; stops: Stop[] };
type Proof = { type: string; reference: string; note: string };

export function GroupedDeliveryPage() {
  const token = window.localStorage.getItem('token') || '';
  const [userId, setUserId] = useState('');
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [candidateChoice, setCandidateChoice] = useState<Record<string, string>>({});
  const [sharing, setSharing] = useState<'proportionnel' | 'fixe' | 'gratuit'>('proportionnel');
  const [amount, setAmount] = useState('1500');
  const [proofs, setProofs] = useState<Record<string, Proof>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fixedAllocationTotal = selected.reduce((sum, id) => sum + Math.max(0, Number(allocations[id] || 0)), 0);
  const fixedAllocationValid = sharing !== 'fixe' || Math.round(fixedAllocationTotal) === Math.round(Number(amount || 0));

  const load = useCallback(async () => {
    if (!token) { setLoading(false); setError('Connectez-vous pour gérer les missions groupées.'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE}/api/missions-livraison/miennes`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => []);
      if (!response.ok) throw new Error(body.message || 'Impossible de charger les missions.');
      setMissions(Array.isArray(body) ? body : []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de charger les missions.'); }
    finally { setLoading(false); }
  }, [token]);

  const loadRequestsAndCouriers = useCallback(async () => {
    if (!token) return;
    const [requestsResponse, candidatesResponse] = await Promise.all([
      fetch(`${API_BASE}/api/missions-livraison/demandes-rattachables`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/api/missions-livraison/candidats`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const [requestBody, candidateBody] = await Promise.all([requestsResponse.json().catch(() => []), candidatesResponse.json().catch(() => [])]);
    setRequests(requestsResponse.ok && Array.isArray(requestBody) ? requestBody : []);
    setCandidates(candidatesResponse.ok && Array.isArray(candidateBody) ? candidateBody : []);
  }, [token]);

  useEffect(() => {
    try { const user = JSON.parse(window.localStorage.getItem('loka_user') || '{}'); setUserId(String(user._id || '')); } catch { setUserId(''); }
    void load(); void loadRequestsAndCouriers();
  }, [load, loadRequestsAndCouriers]);

  function toggleRequest(id: string) {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setAllocations(current => current[id] ? current : { ...current, [id]: String(requests.find(item => item._id === id)?.tarif || 0) });
  }

  async function createMission(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(`${API_BASE}/api/missions-livraison`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ demandeIds: selected, montantTotal: sharing === 'gratuit' ? 0 : Number(amount), partageFrais: sharing, allocations: Object.fromEntries(selected.map(id => [id, Number(allocations[id] || 0)])) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'Création impossible.');
      setNotice('Mission groupée créée à partir des demandes réelles. Chaque retrait et destination est relié à sa demande.');
      trackEvent('delivery_request', 'mission_groupee', String(body._id), { requestCount: selected.length, stopCount: body.stops?.length, amount: body.montantTotal, sharing });
      setSelected([]); setAllocations({}); await Promise.all([load(), loadRequestsAndCouriers()]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Création impossible.'); }
    finally { setBusy(false); }
  }

  async function missionAction(mission: Mission, action: 'proposer' | 'accepter' | 'refuser' | 'demarrer', body: Record<string, string> = {}) {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(`${API_BASE}/api/missions-livraison/${mission._id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Action impossible.');
      setNotice(result.message || 'Mission mise à jour.'); await Promise.all([load(), loadRequestsAndCouriers()]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Action impossible.'); }
    finally { setBusy(false); }
  }

  async function completeStop(mission: Mission, stop: Stop) {
    if (!stop._id) return;
    const proof = proofs[`${mission._id}:${stop._id}`] || { type: 'note', reference: '', note: '' };
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(`${API_BASE}/api/missions-livraison/${mission._id}/arrets/${stop._id}/terminer`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(proof) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'Validation de l’arrêt impossible.');
      setNotice(`Arrêt ${stop.ordre || ''} validé avec une preuve enregistrée.`);
      if (body.mission?.statut === 'terminée') trackEvent('completed', 'mission_groupee', mission._id, { stopCount: mission.stops.length });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Validation de l’arrêt impossible.'); }
    finally { setBusy(false); }
  }

  return <main className="grouped-delivery-page">
    <header className="grouped-delivery-header"><div><span className="section-eyebrow">Livraison · parcours multi-commandes</span><h1>Livraison groupée</h1><p>Sélectionnez des demandes réelles, regroupez leurs retraits et destinations dans une mission, répartissez les frais et conservez une preuve par arrêt.</p></div><Truck size={28}/></header>
    {!token && <div className="commerce-inline-state error">Connectez-vous pour continuer. <a href={`/connexion?next=${encodeURIComponent('/pro/livraisons/groupees')}`}>Se connecter</a></div>}
    {error && <div className="commerce-inline-state error" role="alert">{error}</div>}{notice && <div className="commerce-inline-state motion-success" role="status">{notice}</div>}

    <form className="grouped-delivery-form" onSubmit={createMission}>
      <div className="grouped-delivery-form-head"><div><span className="section-eyebrow">Nouvelle mission</span><h2>Demandes à regrouper</h2></div><span>{selected.length} sélectionnée(s)</span></div>
      <p className="grouped-delivery-help">Choisissez au moins deux demandes de livraison en attente qui vous appartiennent. Les adresses de retrait et de destination doivent être complètes.</p>
      {requests.length === 0 ? <div className="commerce-empty"><Route size={24}/><h3>Aucune demande éligible</h3><p>Créez d’abord des demandes de livraison depuis vos commandes. Les demandes déjà affectées ou groupées ne sont pas proposées.</p></div> : <div className="grouped-request-list">{requests.map(request => <label className={`grouped-request-option ${selected.includes(request._id) ? 'selected' : ''}`} key={request._id}><input type="checkbox" checked={selected.includes(request._id)} onChange={() => toggleRequest(request._id)}/><span><strong>#{request.reference} · {request.sourceType}</strong><small>{request.ville}{request.quartier ? ` · ${request.quartier}` : ''}</small></span><b>{Number(request.tarif || 0).toLocaleString('fr-FR')} FCFA</b></label>)}</div>}
      {sharing === 'fixe' && selected.length > 0 && <div className="grouped-fixed-allocations"><h3>Frais fixes par demande</h3>{selected.map(id => { const request = requests.find(item => item._id === id); return <label key={id}><span>#{request?.reference || id.slice(-8)}</span><input aria-label={`Frais fixes pour ${request?.reference || id}`} type="number" min="0" step="1" value={allocations[id] || '0'} onChange={e => { const next = { ...allocations, [id]: e.target.value }; setAllocations(next); setAmount(String(selected.reduce((sum, selectedId) => sum + Math.max(0, Number(next[selectedId] || 0)), 0))); }}/></label>; })}<p className={fixedAllocationValid ? 'grouped-allocation-valid' : 'grouped-allocation-error'} role="status">Total réparti : {fixedAllocationTotal.toLocaleString('fr-FR')} FCFA {fixedAllocationValid ? '· cohérent' : `· le total de mission doit être ${fixedAllocationTotal} FCFA`}</p></div>}
      <div className="grouped-fees"><label>Mode de répartition<select value={sharing} onChange={e => { const next = e.target.value as typeof sharing; setSharing(next); if (next === 'fixe') setAmount(String(selected.reduce((sum, id) => sum + Math.max(0, Number(allocations[id] || requests.find(item => item._id === id)?.tarif || 0)), 0))); else if (next === 'gratuit') setAmount('0'); else setAmount('1500'); }}><option value="proportionnel">Proportionnel aux tarifs des demandes</option><option value="fixe">Montants fixes par demande</option><option value="gratuit">Gratuit</option></select></label><label>Frais totaux (FCFA)<input type="number" min="0" step="1" disabled={sharing === 'gratuit'} required value={sharing === 'gratuit' ? 0 : amount} onChange={e => setAmount(e.target.value)}/></label></div>
      <button type="submit" className="button button-primary" disabled={!token || busy || selected.length < 2 || !fixedAllocationValid}>{busy ? 'Enregistrement…' : `Créer la mission · ${selected.length} demande(s)`}</button>
    </form>

    <section className="grouped-missions"><header><div><span className="section-eyebrow">Historique</span><h2>Mes missions groupées</h2></div><button className="button button-secondary" type="button" onClick={() => { void load(); void loadRequestsAndCouriers(); }} disabled={loading}><RefreshCw size={15}/> Actualiser</button></header>
      {loading ? <div className="commerce-empty">Chargement des missions…</div> : missions.length === 0 ? <div className="commerce-empty"><Route size={25}/><h3>Aucune mission groupée</h3><p>Les missions créées apparaîtront ici.</p></div> : <div className="grouped-mission-list">{missions.map(mission => <article className="grouped-mission-card" key={mission._id}>
        <header><div><strong>Mission {mission._id.slice(-8).toUpperCase()}</strong><small>{mission.stops.length} arrêts · {mission.statut}</small>{mission.livreur && <small>Livreur affecté : {String(mission.livreur).slice(-8).toUpperCase()}</small>}</div><b>{Number(mission.montantTotal || 0).toLocaleString('fr-FR')} FCFA</b></header>
        {mission.statut === 'en_attente' && String(mission.createur || '') === userId && <div className="grouped-assignment"><label>Proposer à un livreur actif et disponible<select value={candidateChoice[mission._id] || ''} onChange={e => setCandidateChoice(current => ({ ...current, [mission._id]: e.target.value }))}><option value="">Choisir un livreur</option>{candidates.map(candidate => <option key={candidate.utilisateurId} value={candidate.utilisateurId}>{candidate.nom} · {candidate.transport}{candidate.zones.length ? ` · ${candidate.zones.join(', ')}` : ''}</option>)}</select></label><button className="button button-primary" type="button" disabled={busy || !candidateChoice[mission._id]} onClick={() => void missionAction(mission, 'proposer', { livreurId: candidateChoice[mission._id] })}>Envoyer la proposition</button></div>}
        {mission.statut === 'proposée' && mission.livreur === userId && <div className="grouped-courier-actions"><button className="button button-primary" type="button" disabled={busy} onClick={() => void missionAction(mission, 'accepter')}>Accepter la mission</button><button className="button button-secondary" type="button" disabled={busy} onClick={() => void missionAction(mission, 'refuser')}>Refuser</button></div>}
        {mission.statut === 'assignée' && mission.livreur === userId && <button className="button button-primary" type="button" disabled={busy} onClick={() => void missionAction(mission, 'demarrer')}>Démarrer le parcours</button>}
        <div className="grouped-mission-stops">{mission.stops.slice().sort((a,b)=>(a.ordre||0)-(b.ordre||0)).map((stop,index)=><div className="grouped-mission-stop" key={stop._id || index}><span className={stop.statut === 'termine' ? 'stop-done' : ''}>{stop.statut === 'termine' ? <CheckCircle2 size={16}/> : <MapPin size={16}/>}</span><div><strong>{index + 1}. {stop.type === 'pickup' ? 'Retrait' : 'Destination'}{stop.libelle ? ` · ${stop.libelle}` : ''}</strong><small>{[stop.adresse?.ville, stop.adresse?.quartier, stop.adresse?.details].filter(Boolean).join(' · ')}</small>{stop.type === 'dropoff' && <small>Frais alloués : {Number(stop.montantAlloue || 0).toLocaleString('fr-FR')} FCFA</small>}{stop.preuve?.valideeLe && <small>Preuve : {stop.preuve.type} · {new Date(stop.preuve.valideeLe).toLocaleString('fr-FR')}</small>}</div>
          {stop.statut !== 'termine' && mission.statut === 'en_route' && mission.livreur === userId && <div className="grouped-proof-form"><select aria-label="Type de preuve" value={(proofs[`${mission._id}:${stop._id}`] || { type: 'note' }).type} onChange={e => setProofs(old => ({ ...old, [`${mission._id}:${stop._id}`]: { ...(old[`${mission._id}:${stop._id}`] || { reference: '', note: '' }), type: e.target.value } }))}><option value="note">Note</option><option value="code">Code</option><option value="photo">Référence photo</option><option value="signature">Signature</option></select><input aria-label="Référence de preuve" placeholder="Référence de preuve" value={(proofs[`${mission._id}:${stop._id}`] || { reference: '' }).reference} onChange={e => setProofs(old => ({ ...old, [`${mission._id}:${stop._id}`]: { ...(old[`${mission._id}:${stop._id}`] || { type: 'note', note: '' }), reference: e.target.value } }))}/><input aria-label="Note de preuve" placeholder="Note obligatoire si pas de référence" value={(proofs[`${mission._id}:${stop._id}`] || { note: '' }).note} onChange={e => setProofs(old => ({ ...old, [`${mission._id}:${stop._id}`]: { ...(old[`${mission._id}:${stop._id}`] || { type: 'note', reference: '' }), note: e.target.value } }))}/><button type="button" className="button button-secondary" disabled={busy} onClick={() => void completeStop(mission, stop)}>Valider l’arrêt</button></div>}</div>)}</div>
      </article>)}</div>}
    </section>
  </main>;
}
