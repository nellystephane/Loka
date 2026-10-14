import type { CSSProperties, ReactNode } from 'react';
import { MapPin, Star } from 'lucide-react';
import { MediaCarousel } from '../media/MediaCarousel';
import type { BaseCard } from './types';

type Props = BaseCard & { kind: string; meta?: React.ReactNode; footer?: React.ReactNode; children?: ReactNode };

export function SharedCard({ title, subtitle, description, media = [], badge, location, rating, reviewCount, href, action, signatureColor, kind, meta, footer, children }: Props) {
  const body = <article className="entity-card" style={signatureColor ? { '--card-signature': signatureColor } as CSSProperties : undefined}>
    {media.length > 0 ? <MediaCarousel items={media} aspectRatio="landscape" viewerTitle={title} viewerDescription={description ?? subtitle} viewerMeta={location} /> : <div className="card-media-empty" />}
    <div className="entity-card-body">
      <div className="card-heading-row"><div><span className="card-kind">{kind}</span><h3>{title}</h3>{subtitle && <p className="card-subtitle">{subtitle}</p>}</div>{badge && <span className="badge card-badge">{badge}</span>}</div>
      {description && <p className="card-description">{description}</p>}
      {(location || rating !== undefined || meta) && <div className="card-meta">{location && <span><MapPin size={14} />{location}</span>}{rating !== undefined && <span><Star size={14} fill="currentColor" />{rating.toFixed(1)}{reviewCount !== undefined ? ` (${reviewCount})` : ''}</span>}{meta}</div>}
      {children}
      {(footer || action) && <div className="card-footer">{footer}<div className="card-action">{action && (action.href || href ? <a className="button button-secondary" href={action.href ?? href}>{action.label}</a> : <button className="button button-secondary" onClick={action.onClick}>{action.label}</button>)}</div></div>}
    </div>
  </article>;
  return href && !action ? <a className="card-link-wrap" href={href}>{body}</a> : body;
}
