import { useState } from 'react';
import { Check, Copy, ExternalLink, Share2, QrCode } from 'lucide-react';
import { trackEvent, trackShare } from '../../services/analytics';

type ShareChannel = 'whatsapp' | 'facebook' | 'x' | 'instagram' | 'tiktok' | 'qr' | 'copy' | 'native';
type Props = { title?: string; text?: string; url?: string; className?: string; cibleType?: string; cibleId?: string };

export function ShareButton({ title = 'Loka', text = '', url = typeof window !== 'undefined' ? window.location.href : '', className = 'button button-secondary', cibleType = 'page', cibleId }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [showQr, setShowQr] = useState(false);
  const encoded = encodeURIComponent(url);
  const message = `${title}${text ? ` — ${text}` : ''} ${url}`.trim();
  const links: Array<{ label: string; href: string; channel: ShareChannel }> = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(message)}`, channel: 'whatsapp' },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, channel: 'facebook' },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(title)}`, channel: 'x' },
  ];

  async function copy(channel: ShareChannel = 'copy') {
    setCopyError('');
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const field = document.createElement('textarea');
        field.value = url; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0';
        document.body.appendChild(field); field.select();
        const ok = document.execCommand('copy'); field.remove();
        if (!ok) throw new Error('Copie non autorisée par le navigateur.');
      }
      setCopied(true); trackEvent('share', cibleType, cibleId, { channel, url }); trackShare(cibleType, cibleId, channel === 'copy' ? 'copie' : channel === 'native' ? 'natif' : channel === 'qr' ? 'qr' : channel === 'instagram' || channel === 'tiktok' || channel === 'whatsapp' || channel === 'facebook' ? channel : 'autre');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError('Copie bloquée par le navigateur. Sélectionnez et copiez le lien ci-dessous.');
    }
  }

  async function openNative() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        trackEvent('share', cibleType, cibleId, { channel: 'native', url }); trackShare(cibleType, cibleId, 'natif');
        setOpen(false); return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    setOpen(value => !value);
  }

  async function socialCopy(channel: 'instagram' | 'tiktok', href: string) {
    await copy(channel);
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  return <div className="share-control">
    <button type="button" className={className} onClick={openNative} aria-expanded={open} aria-haspopup="true"><Share2 size={17}/> Partager</button>
    {open && <div className="share-popover" role="dialog" aria-label="Partager ce contenu">
      <strong>Partager {title}</strong>
      {links.map(({ label, href, channel }) => <a key={label} href={href} target="_blank" rel="noreferrer" onClick={() => { trackEvent('share', cibleType, cibleId, { channel, url }); trackShare(cibleType, cibleId, channel === 'x' ? 'autre' : channel === 'copy' ? 'copie' : channel === 'native' ? 'natif' : channel); }}>{label}<ExternalLink size={13}/></a>)}
      <button type="button" onClick={() => void socialCopy('instagram', 'https://www.instagram.com/')}><Copy size={13}/> Instagram · copier le lien</button>
      <button type="button" onClick={() => void socialCopy('tiktok', 'https://www.tiktok.com/')}><Copy size={13}/> TikTok · copier le lien</button>
      <button type="button" onClick={() => void copy('copy')}>{copied ? <><Check size={13}/> Lien copié</> : <><Copy size={13}/> Copier le lien</>}</button>
      <button type="button" onClick={() => { setShowQr(value => !value); trackEvent('share', cibleType, cibleId, { channel: 'qr', url }); trackShare(cibleType, cibleId, 'qr'); }}><QrCode size={13}/> {showQr ? 'Masquer le QR code' : 'Afficher le QR code'}</button>
      {showQr && <div className="share-qr-panel"><img width="190" height="190" loading="lazy" alt={`QR code pour ouvrir ${title}`} src={`https://api.qrserver.com/v1/create-qr-code/?size=190x190&margin=8&data=${encoded}`}/><small>Le QR code est généré par un service externe à partir de ce lien public.</small></div>}
      {copyError && <p role="alert" className="share-error">{copyError}</p>}
      <label className="share-link-field"><span>Lien à partager</span><input readOnly value={url} onFocus={event => event.currentTarget.select()} /></label>
      {'share' in navigator && <small>Le partage natif est aussi disponible sur votre appareil.</small>}
    </div>}
  </div>;
}
