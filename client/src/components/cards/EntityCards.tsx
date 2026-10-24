import { Bike, Clock3, Hotel, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { SharedCard } from './SharedCard';
import type { BaseCard } from './types';

export function FeaturedCard(props: BaseCard) { return <SharedCard {...props} kind="À la une" />; }
export function ProductCard(props: BaseCard & { price?: string; oldPrice?: string }) { return <SharedCard {...props} kind="Produit" meta={<>{props.price && <strong>{props.price}</strong>}{props.oldPrice && <del>{props.oldPrice}</del>}</>} />; }
export function AnnonceCard(props: BaseCard & { category?: string }) { return <SharedCard {...props} kind={props.category ?? 'Annonce'} />; }
export function BusinessCard(props: BaseCard & { category?: string; open?: boolean }) { return <SharedCard {...props} kind={props.category ?? 'Professionnel'} meta={<span className={props.open === false ? 'status-closed' : 'status-open'}><Clock3 size={14} />{props.open === false ? 'Fermé' : 'Ouvert'}</span>} />; }
export function RestaurantCard(props: BaseCard & { cuisine?: string; open?: boolean }) { return <SharedCard {...props} kind="Restaurant" meta={<>{props.cuisine && <span><UtensilsCrossed size={14} />{props.cuisine}</span>}<span className={props.open === false ? 'status-closed' : 'status-open'}>{props.open === false ? 'Fermé' : 'Ouvert'}</span></>} />; }
export function HotelCard(props: BaseCard & { category?: string }) { return <SharedCard {...props} kind="Hôtel" meta={<span><Hotel size={14} />{props.category ?? 'Hébergement'}</span>} />; }
export function CourierCard(props: BaseCard & { transport?: string; available?: boolean }) { return <SharedCard {...props} kind="Livraison" meta={<>{props.transport && <span><Bike size={14} />{props.transport}</span>}<span className={props.available === false ? 'status-closed' : 'status-open'}>{props.available === false ? 'Indisponible' : 'Disponible'}</span></>} />; }
export function ShopCard(props: BaseCard) { return <SharedCard {...props} kind="Boutique" meta={<span><ShoppingBag size={14} />Catalogue</span>} />; }
