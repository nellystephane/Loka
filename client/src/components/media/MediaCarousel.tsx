import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Play, X, MapPin, Images } from 'lucide-react';
import { IconButton } from '../primitives';

export type MediaItem = { src: string; alt?: string; type?: 'image' | 'video'; poster?: string };

type Props = {
  items: MediaItem[];
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'wide';
  rounded?: boolean;
  showFullscreen?: boolean;
  showThumbnails?: boolean;
  className?: string;
  viewerTitle?: string;
  viewerDescription?: string;
  viewerMeta?: string;
};

export function MediaCarousel({ items, aspectRatio = 'landscape', rounded = true, showFullscreen = true, showThumbnails = false, className = '', viewerTitle, viewerDescription, viewerMeta }: Props) {
  const safeItems = useMemo(() => items.filter(Boolean), [items]);
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewerClosing, setViewerClosing] = useState(false);
  const [viewerOrigin, setViewerOrigin] = useState({ x: 50, y: 50 });

  useEffect(() => setIndex((current) => Math.min(current, Math.max(0, safeItems.length - 1))), [safeItems.length]);
  useEffect(() => {
    const next = safeItems[(index + 1) % Math.max(safeItems.length, 1)];
    if (next?.type !== 'video' && next?.src) { const img = new Image(); img.src = next.src; }
  }, [index, safeItems]);

  if (!safeItems.length) return <div className={`media-placeholder ${className}`} aria-label="Aucun média disponible" />;

  const current = safeItems[index];
  const go = (delta: number) => setIndex((value) => (value + delta + safeItems.length) % safeItems.length);
  const openViewer = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setViewerOrigin({
      x: Math.max(8, Math.min(92, ((rect.left + rect.width / 2) / window.innerWidth) * 100)),
      y: Math.max(8, Math.min(92, ((rect.top + rect.height / 2) / window.innerHeight) * 100)),
    });
    setViewerClosing(false);
    setFullscreen(true);
  };
  const closeViewer = () => {
    if (viewerClosing) return;
    setViewerClosing(true);
    window.setTimeout(() => { setFullscreen(false); setViewerClosing(false); }, 160);
  };

  const content = (large = false) => current.type === 'video' ? (
    <div className="media-video-wrap">
      <video className="media-content" src={current.src} poster={current.poster} controls={large} muted playsInline loop autoPlay={!large} aria-label={current.alt} />
      {!large && <span className="media-video-badge"><Play size={13} fill="currentColor" /> Vidéo</span>}
    </div>
  ) : <img className="media-content" src={current.src} alt={current.alt ?? ''} />;

  return <>
    <div className={`media-carousel media-ratio-${aspectRatio} ${rounded ? 'media-rounded' : ''} ${className}`}>
      {content()}
      {safeItems.length > 1 && <>
        <IconButton className="media-nav media-prev" label="Média précédent" onClick={() => go(-1)}><ChevronLeft size={18} /></IconButton>
        <IconButton className="media-nav media-next" label="Média suivant" onClick={() => go(1)}><ChevronRight size={18} /></IconButton>
        <div className="media-dots" aria-label={`Média ${index + 1} sur ${safeItems.length}`}>
          {safeItems.map((_, i) => <button key={i} className={`media-dot ${i === index ? 'active' : ''}`} onClick={() => setIndex(i)} aria-label={`Afficher le média ${i + 1}`} />)}
        </div>
      </>}
      {showFullscreen && <IconButton className="media-fullscreen" label="Agrandir le média" onClick={(event) => openViewer(event)}><Maximize2 size={17} /></IconButton>}
      {safeItems.length > 1 && <span className="media-count">{index + 1}/{safeItems.length}</span>}
    </div>
    {showThumbnails && safeItems.length > 1 && <div className="media-thumbnails">
      {safeItems.map((item, i) => <button key={`${item.src}-${i}`} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Média ${i + 1}`}>
        {item.type === 'video' ? <div className="media-thumb-video"><Play size={12} fill="currentColor" /></div> : <img src={item.src} alt="" />}
      </button>)}
    </div>}
    {fullscreen && <div className="media-viewer-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeViewer() }}>
      <section className={`media-viewer ${viewerClosing ? 'is-closing' : ''}`} style={{'--viewer-origin-x': `${viewerOrigin.x}%`, '--viewer-origin-y': `${viewerOrigin.y}%`} as React.CSSProperties} role="dialog" aria-modal="true" aria-label={viewerTitle ?? 'Aperçu du média'}>
        <button className="media-viewer-close" type="button" aria-label="Fermer" onClick={closeViewer}><X size={20} /></button>
        <div className="media-viewer-stage">{content(true)}
          {safeItems.length > 1 && <><IconButton className="media-viewer-prev" label="Média précédent" onClick={() => go(-1)}><ChevronLeft /></IconButton><IconButton className="media-viewer-next" label="Média suivant" onClick={() => go(1)}><ChevronRight /></IconButton></>}
          <span className="media-viewer-counter"><Images size={14} /> {index + 1} / {safeItems.length}</span>
        </div>
        <aside className="media-viewer-info">
          <div>
            <span className="media-viewer-kicker">Aperçu</span>
            <h2>{viewerTitle ?? current.alt ?? 'Média Loka'}</h2>
            {viewerDescription && <p>{viewerDescription}</p>}
            {viewerMeta && <div className="media-viewer-meta"><MapPin size={16} /> {viewerMeta}</div>}
          </div>
          {safeItems.length > 1 && <div className="media-viewer-dots">{safeItems.map((_, i) => <button key={i} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Afficher le média ${i + 1}`} />)}</div>}
        </aside>
      </section>
    </div>}
  </>;
}
