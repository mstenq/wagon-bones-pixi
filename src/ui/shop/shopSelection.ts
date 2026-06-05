export type SelectedShopOffer =
  | { kind: 'stock'; stockIndex: number }
  | { kind: 'permit'; permitId: string; isPrimary: boolean }
  | { kind: 'pack'; packIndex: number };

export function shopOfferKey(offer: SelectedShopOffer): string {
  if (offer.kind === 'stock') {
    return `stock:${offer.stockIndex}`;
  }
  if (offer.kind === 'permit') {
    return `permit:${offer.isPrimary ? 'primary' : 'bonus'}:${offer.permitId}`;
  }
  return `pack:${offer.packIndex}`;
}

export function isOfferSelected(offer: SelectedShopOffer, selected: SelectedShopOffer | null): boolean {
  if (!selected) {
    return false;
  }
  return shopOfferKey(offer) === shopOfferKey(selected);
}
