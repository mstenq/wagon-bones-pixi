import { UI } from '@/game/Constants';

/** Vertical lift of card centers within the bar (matches Phaser `CARD_VERTICAL_OFFSET`). */
export const CARD_BAR_VERTICAL_OFFSET = 20;

export type CardBarTheme = {
  cardWidth: number;
  cardHeight: number;
  preferredSpacing: number;
  barPadding: number;
  verticalOffset: number;
};

export const EQUIPMENT_CARD_BAR_THEME: CardBarTheme = {
  cardWidth: UI.CARD_W * UI.EQUIP_CARD_SCALE,
  cardHeight: UI.CARD_H * UI.EQUIP_CARD_SCALE,
  preferredSpacing: UI.EQUIP_CARD_SPACING,
  barPadding: 20,
  verticalOffset: CARD_BAR_VERTICAL_OFFSET,
};

export const CONSUMABLE_CARD_BAR_THEME: CardBarTheme = {
  cardWidth: UI.CARD_W * UI.CONSUMABLE_CARD_SCALE,
  cardHeight: UI.CARD_H * UI.CONSUMABLE_CARD_SCALE,
  preferredSpacing: UI.CONSUMABLE_CARD_SPACING,
  barPadding: 16,
  verticalOffset: CARD_BAR_VERTICAL_OFFSET,
};
