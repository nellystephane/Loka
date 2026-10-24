import type { StorefrontProduct } from './StorefrontProductQuickView';
import { publicItems } from '../../data/demo';

type Shop = typeof publicItems.shop;

export function buildBoutiqueProducts(item: Shop): StorefrontProduct[] {
  return [
    { id: 'MN-01', name: 'La matière', category: 'SIGNATURE', price: '45 000 FCFA', image: item.media[0].src, alt: item.media[0].alt, description: 'Une pièce de la sélection Maison Naya, pensée pour être portée au quotidien tout en gardant une présence forte.', colors: ['#111111', '#D7FF4F', '#F7F7F2'], sizes: ['S', 'M', 'L', 'XL'], details: [{ label: 'Matière', value: 'Coton & textile mixte' }, { label: 'Disponibilité', value: 'En stock' }, { label: 'Origine', value: 'Sélection locale' }] },
    { id: 'MN-02', name: 'La silhouette', category: 'ÉDITION', price: '32 000 FCFA', image: item.media[1].src, alt: item.media[1].alt, description: 'Une forme plus douce et graphique, sélectionnée pour son équilibre entre usage et caractère.', colors: ['#6C4DFF', '#9EEAFF', '#FFFFFF'], sizes: ['Unique'], details: [{ label: 'Matière', value: 'Textile souple' }, { label: 'Disponibilité', value: 'En stock' }, { label: 'Édition', value: 'Drop local' }] },
    { id: 'MN-03', name: 'Form Study', category: 'LIMITED', price: '58 000 FCFA', image: item.media[0].src, alt: item.media[0].alt, description: 'Une édition limitée conçue pour devenir le point focal d’une silhouette ou d’un espace.', colors: ['#FF5A36', '#FFB6D9', '#111A3A'], sizes: ['M', 'L'], details: [{ label: 'Matière', value: 'Textile premium' }, { label: 'Disponibilité', value: 'Dernières pièces' }, { label: 'Édition', value: 'Limited' }] },
  ];
}
