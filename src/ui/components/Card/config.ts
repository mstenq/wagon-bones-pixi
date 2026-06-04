export type CardDisplayMode = "shop" | "pack" | "owned";

export const CARD_LIFT_PX = 28;
export const CARD_HOVER_SCALE = 1.03;
export const CARD_OWNED_ENLARGED_SCALE = 1.14;
/** Renders above row siblings when a card is selected. */
export const CARD_SELECTED_Z_INDEX = 500;
/** Dragged card within the row, and CardContainer vs sibling rows (e.g. DiceRow). */
export const CARD_DRAG_Z_INDEX = 1000;
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

export { CARD_COUNT } from "@/data/items";
