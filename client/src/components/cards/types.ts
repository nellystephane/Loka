import type { MediaItem } from '../media/MediaCarousel';

export type CardAction = { label: string; onClick?: () => void; href?: string };
export type BaseCard = { id?: string; title: string; subtitle?: string; description?: string; media?: MediaItem[]; badge?: string; location?: string; rating?: number; reviewCount?: number; href?: string; action?: CardAction; signatureColor?: string };
