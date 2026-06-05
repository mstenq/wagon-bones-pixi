/** Item / supply card catalog — export only, no imports. */

/** Max cards shown in a container row (demo default). */
export const CARD_COUNT = 5;

export const ITEM_TYPES = ['ace_in_the_hole', 'antique_revolver', 'bank_note', 'bargain_bin', 'blessed_herd'] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_LABELS: Record<ItemType, string> = {
  ace_in_the_hole: 'Ace in the Hole',
  antique_revolver: 'Antique Revolver',
  bank_note: 'Bank Note',
  bargain_bin: 'Bargain Bin',
  blessed_herd: 'Blessed Herd',
};

export function itemTypeForCard(cardId: number): ItemType {
  return ITEM_TYPES[cardId % ITEM_TYPES.length]!;
}
