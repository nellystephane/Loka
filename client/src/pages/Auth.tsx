import { useEffect, useState, type FormEvent, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { appPath } from '../utils/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, MapPin, ShieldCheck, Sparkles, UserRound, type LucideIcon } from 'lucide-react';

const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) || 'https://proxiconnect.onrender.com').replace(/\/$/, '');
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';
declare global { interface Window { google?: { accounts?: { id?: { initialize: (config: {client_id:string;callback:(response:{credential?:string})=>void})=>void; renderButton:(element:HTMLElement,options:Record<string,unknown>)=>void; cancel:()=>void } } } } }
type AuthUser = { token: string; [key: string]: unknown };

function safeReturnTo() {
  const requested = new URLSearchParams(window.location.search).get('returnTo');
  if (!requested || !requested.startsWith('/') || requested.startsWith('//') || requested.startsWith('/\\')) return appPath('/');
  return appPath(requested);
}

async function submitAuth(path: string, payload: Record<string, string>): Promise<AuthUser> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/users/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
  } catch {
    throw new Error("Le serveur Loka est momentanément injoignable. Vérifiez votre connexion puis réessayez.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Impossible de vous connecter pour le moment.");
  return data as AuthUser;
}

type FieldProps = { label: string; icon: LucideIcon; } & InputHTMLAttributes<HTMLInputElement>;
function Field({ label, icon: Icon, ...props }: FieldProps) {
  return <label className="auth-field"><span>{label}</span><span className="auth-input-wrap"><Icon size={17} aria-hidden="true"/><input {...props} required={props.required ?? true}/></span></label>;
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(() => new URLSearchParams(window.location.search).get('session') === 'expired' ? 'Votre session a expiré ou n’est plus valide. Reconnectez-vous pour continuer.' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSent, setRegistrationSent] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [values, setValues] = useState({ prenom: '', nom: '', email: '', motDePasse: '', telephone: '', ville: '' });
  const update = (key: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) => setValues(v => ({ ...v, [key]: e.target.value }));

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || isRegister || registrationSent) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.google?.accounts?.id) return;
      const api = window.google.accounts.id;
      api.initialize({ client_id: GOOGLE_CLIENT_ID, callback: async (credential) => {
        if (!credential.credential) { setGoogleError('Google n’a pas renvoyé de jeton de connexion. Réessayez.'); return; }
        setGoogleBusy(true); setGoogleError('');
        try {
          const response = await fetch(`${API_BASE}/api/users/google`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({idToken:credential.credential}) });
          const data = await response.json().catch(()=>({}));
          if (!response.ok) throw new Error(data.message || 'La connexion Google a échoué.');
          if (!data.token) throw new Error('Le serveur n’a pas créé de session. Réessayez.');
          localStorage.setItem('token', data.token); const {token:_token,...profile}=data; localStorage.setItem('loka_user',JSON.stringify(profile)); window.location.assign(safeReturnTo());
        } catch (e) { setGoogleError(e instanceof Error?e.message:'Impossible de se connecter avec Google.'); }
        finally { setGoogleBusy(false); }
      }});
      const target=document.getElementById('loka-google-button'); if(target){target.replaceChildren();api.renderButton(target,{theme:'outline',size:'large',shape:'pill',text:'continue_with',width:Math.min(320,target.clientWidth||320),logo_alignment:'left'});setGoogleReady(true);}
    };
    const existing=document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if(window.google?.accounts?.id) render(); else if(existing) existing.addEventListener('load',render,{once:true}); else {const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset.googleIdentity='true';script.onload=render;script.onerror=()=>setGoogleError('Le service de connexion Google est indisponible.');document.head.appendChild(script);}
    return()=>{cancelled=true;};
  },[isRegister,registrationSent]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await submitAuth(isRegister ? 'register' : 'login', isRegister ? values : { email: values.email.trim(), motDePasse: values.motDePasse });
      if (isRegister) {
        // Le backend exige une confirmation d’e-mail avant la connexion : ne pas
        // créer une session active prématurément après l’inscription.
        localStorage.removeItem('token');
        localStorage.removeItem('loka_user');
        setRegistrationSent(true);
        return;
      }
      if (!result.token) throw new Error('Le serveur n’a pas renvoyé de session valide. Réessayez.');
      localStorage.setItem('token', result.token);
      const { token: _token, ...profile } = result;
      localStorage.setItem('loka_user', JSON.stringify(profile));
      window.location.assign(safeReturnTo());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.');
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <a href={appPath("/")} className="auth-back"><ArrowLeft size={16}/> Retour à l’exploration</a>
    <section className="auth-layout">
      <aside className="auth-story">
        <a className="auth-brand" href={appPath("/")} aria-label="Loka, accueil"><span className="brand-mark">L</span><span>Loka</span></a>
        <div className="auth-story-copy"><span className="auth-kicker"><Sparkles size={14}/> LE LOCAL, EN PLUS SIMPLE</span><h1>{isRegister ? 'Tout ce qui compte, près de vous.' : 'Heureux de vous retrouver.'}</h1><p>{isRegister ? 'Découvrez des boutiques, restaurants et hébergements, échangez avec les professionnels et retrouvez vos commandes au même endroit.' : 'Reprenez votre exploration, retrouvez vos échanges et suivez vos commandes ou réservations.'}</p></div>
        <div className="auth-story-foot"><ShieldCheck size={16}/><span>Une expérience pensée pour vous, sur mobile comme sur ordinateur.</span></div>
        <div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/>
      </aside>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card-heading"><span className="auth-icon"><UserRound size={20}/></span><span className="auth-kicker">VOTRE ESPACE LOKA</span><h2 id="auth-title">{isRegister ? 'Créer votre compte' : 'Connexion'}</h2><p>{isRegister ? 'Quelques informations pour commencer.' : 'Connectez-vous pour continuer là où vous en étiez.'}</p></div>
        {registrationSent ? <div className="auth-success" role="status"><ShieldCheck size={25}/><strong>Encore une étape pour activer votre compte</strong><p>Un e-mail de confirmation vient d’être demandé. Ouvrez le lien reçu avant de vous connecter. Pensez à vérifier les courriers indésirables.</p><a className="auth-submit" href={appPath('/renvoyer-confirmation')}>Renvoyer le lien de confirmation <ArrowRight size={17}/></a><a className="auth-switch" href={appPath('/connexion')}>J’ai déjà confirmé mon adresse</a></div> : <>
        {error && <div className="auth-error" role="alert">{error}{error.toLowerCase().includes('confirmer votre adresse') && <><p>Consultez votre boîte mail, y compris les courriers indésirables.</p><a href={appPath('/renvoyer-confirmation')}>Renvoyer le lien de confirmation</a></>}</div>}
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {isRegister && <div className="auth-two-col"><Field label="Prénom" icon={UserRound} name="prenom" placeholder="Votre prénom" autoComplete="given-name" value={values.prenom} onChange={update('prenom')}/><Field label="Nom" icon={UserRound} name="nom" placeholder="Votre nom" autoComplete="family-name" value={values.nom} onChange={update('nom')}/></div>}
          <Field label="Adresse e-mail" icon={Mail} name="email" type="email" placeholder="vous@exemple.com" autoComplete="email" value={values.email} onChange={update('email')}/>
          {isRegister && <><Field label="Ville" icon={MapPin} name="ville" placeholder="Votre ville" autoComplete="address-level2" value={values.ville} onChange={update('ville')}/><Field label="Téléphone (facultatif)" icon={UserRound} name="telephone" type="tel" placeholder="Votre numéro de téléphone" autoComplete="tel" required={false} value={values.telephone} onChange={update('telephone')}/></>}
          <label className="auth-field"><span>Mot de passe</span><span className="auth-input-wrap"><LockKeyhole size={17}/><input name="motDePasse" type={showPassword ? 'text' : 'password'} placeholder={isRegister ? '8 caractères minimum' : 'Votre mot de passe'} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} required value={values.motDePasse} onChange={update('motDePasse')}/><button className="auth-password-toggle" type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>
          {!isRegister && <div className="auth-help-row"><span>Utilisez l’e-mail associé à votre compte.</span><a href={appPath("/mot-de-passe-oublie")}>Mot de passe oublié ?</a></div>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? <><span className="auth-spinner"/> {isRegister ? 'Création du compte…' : 'Connexion…'}</> : <>{isRegister ? 'Créer mon compte' : 'Se connecter'} <ArrowRight size={17}/></>}</button>
          <p className="auth-legal">En continuant, vous acceptez les conditions d’utilisation et la politique de confidentialité de Loka.</p>
        </form>
        {!isRegister && GOOGLE_CLIENT_ID && <div className="auth-google-block"><div className="auth-divider"><span>ou</span></div>{googleError&&<div className="auth-error" role="alert">{googleError}</div>}<div id="loka-google-button" className="auth-google-button" aria-label="Continuer avec Google"/>{googleBusy&&<p className="auth-google-status" role="status">Connexion à Google…</p>}{!googleReady&&!googleBusy&&<p className="auth-google-status">Chargement du bouton Google…</p>}</div>}
        <div className="auth-switch">{isRegister ? 'Vous avez déjà un compte ?' : 'Vous découvrez Loka ?'} <a href={appPath(isRegister ? '/connexion' : '/inscription')}>{isRegister ? 'Se connecter' : 'Créer un compte'}</a></div>
        </>}
      </section>
    </section>
  </main>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      let response: Response;
      try { response = await fetch(`${API_BASE}/api/users/password/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) }); }
      catch { throw new Error('Le serveur Loka est momentanément injoignable. Réessayez dans quelques instants.'); }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Impossible de traiter la demande pour le moment.');
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Une erreur est survenue.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><a href={appPath('/connexion')} className="auth-back"><ArrowLeft size={16}/> Retour à la connexion</a><section className="auth-layout auth-layout-compact"><aside className="auth-story"><a className="auth-brand" href={appPath('/')}><span className="brand-mark">L</span><span>Loka</span></a><div className="auth-story-copy"><span className="auth-kicker"><ShieldCheck size={14}/> ACCÈS SÉCURISÉ</span><h1>Retrouvons l’accès à votre compte.</h1><p>Nous vous aiderons à réinitialiser votre mot de passe à l’aide de l’adresse e-mail associée à votre compte.</p></div><div className="auth-story-foot"><ShieldCheck size={16}/><span>Pour votre sécurité, la réponse ne révèle pas si une adresse possède un compte.</span></div></aside><section className="auth-card" aria-labelledby="forgot-title"><div className="auth-card-heading"><span className="auth-icon"><LockKeyhole size={20}/></span><span className="auth-kicker">RÉCUPÉRATION</span><h2 id="forgot-title">Mot de passe oublié ?</h2><p>Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p></div>{error && <div className="auth-error" role="alert">{error}</div>}{sent ? <div className="auth-success" role="status"><ShieldCheck size={22}/><strong>Demande prise en compte</strong><p>Si un compte correspond à cette adresse, un e-mail de réinitialisation a été envoyé. Vérifiez aussi vos courriers indésirables.</p><a className="auth-submit" href={appPath('/connexion')}>Retour à la connexion <ArrowRight size={17}/></a></div> : <form className="auth-form" onSubmit={onSubmit}><Field label="Adresse e-mail" icon={Mail} name="email" type="email" placeholder="vous@exemple.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}/><button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Envoi en cours…' : 'Recevoir le lien'} {!busy && <ArrowRight size={17}/>}</button></form>}<div className="auth-switch">Vous vous souvenez du mot de passe ? <a href={appPath('/connexion')}>Se connecter</a></div></section></section></main>;
}
