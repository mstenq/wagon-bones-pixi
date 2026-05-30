import aceInTheHoleImg from "@/assets/items/ace_in_the_hole.png";
import antiqueRevolverImg from "@/assets/items/antique_revolver.png";
import bankNoteImg from "@/assets/items/bank_note.png";
import bargainBinImg from "@/assets/items/bargain_bin.png";
import blessedHerdImg from "@/assets/items/blessed_herd.png";

/** Max cards shown in the hand row (demo default). */
export const CARD_COUNT = 5;

export const ITEM_TYPES = [
  "ace_in_the_hole",
  "antique_revolver",
  "bank_note",
  "bargain_bin",
  "blessed_herd",
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_LABELS: Record<ItemType, string> = {
  ace_in_the_hole: "Ace in the Hole",
  antique_revolver: "Antique Revolver",
  bank_note: "Bank Note",
  bargain_bin: "Bargain Bin",
  blessed_herd: "Blessed Herd",
};

export const ITEM_IMAGES: Record<ItemType, string> = {
  ace_in_the_hole: aceInTheHoleImg,
  antique_revolver: antiqueRevolverImg,
  bank_note: bankNoteImg,
  bargain_bin: bargainBinImg,
  blessed_herd: blessedHerdImg,
};

export function itemTypeForCard(cardId: number): ItemType {
  return ITEM_TYPES[cardId % ITEM_TYPES.length]!;
}

export type CardDisplayMode = "shop" | "pack" | "owned";

export const CARD_CORNER_RADIUS = 12;
export const CARD_LIFT_PX = 28;
export const CARD_HOVER_SCALE = 1.06;
export const CARD_OWNED_ENLARGED_SCALE = 1.14;
/** Renders above row siblings when a card is selected (drag uses 1000). */
export const CARD_SELECTED_Z_INDEX = 500;
export const SELL_TAB_ATTACH_OVERLAP = 8;
export const SELL_TAB_WIDTH = 92;
/** Keeps label off the flat edge that tucks under the card. */
export const SELL_TAB_LEFT_PADDING = 16;
export const ACTION_TAB_ATTACH_OVERLAP = 55;
export const TAB_SHADOW_OFFSET_X = 2;
export const TAB_SHADOW_OFFSET_Y = 3;
export const TAB_SHADOW_ALPHA = 0.38;

export const TAB_GREEN = 0x3daa5c;
export const PRICE_TAB_COLOR = 0x12121a;
export const PRICE_TAB_STROKE = 0x2e2e3a;
export const PRICE_TAB_TEXT_COLOR = "#F5A02E";
export const TAB_WIDTH = 72;
export const TAB_HEIGHT = 28;
/** Visible label area of the shop/pack bottom tab. */
export const ACTION_TAB_VISIBLE_HEIGHT = TAB_HEIGHT;
/** Extra flat area tucked under the card above the label. */
export const ACTION_TAB_TOP_PADDING = 28;
export const ACTION_TAB_HEIGHT = ACTION_TAB_VISIBLE_HEIGHT + ACTION_TAB_TOP_PADDING;
export const SELL_TAB_HEIGHT = TAB_HEIGHT + 4;
export const PRICE_TAB_HEIGHT = 24;

/** Half-size of the square drag/hit box for an embedded owned card (body + sell tab). */
export function cardHandHitHalf(cardWidth: number, cardHeight: number): number {
  const scale = CARD_OWNED_ENLARGED_SCALE;
  const halfW = (cardWidth / 2) * scale;
  const halfH = (cardHeight / 2) * scale;
  const sellRight =
    (cardWidth / 2) * scale - SELL_TAB_ATTACH_OVERLAP + SELL_TAB_WIDTH;
  return Math.max(halfW, halfH, sellRight);
}
