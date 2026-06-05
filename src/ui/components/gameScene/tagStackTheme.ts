import { TAG_STACK, UI } from '@/game/Constants';
import type { GameScenePixiLayoutMetrics } from '@/ui/layout/gameScenePixiLayout';

export const TAG_COLORS: Record<string, number> = {
  shop: 0x44aa44,
  shop_aura: 0x9966cc,
  boss: 0xcc4444,
  immediate_pack: 0x4488cc,
  immediate_money: 0xccaa44,
  immediate_equipment: 0x88aa44,
  immediate_upgrade: 0x5b9bd5,
  next_round: 0xcc8844,
  meta: 0xcccccc,
};

export const TAG_ICONS: Record<string, string> = {
  tag_uncommon: '🏷️',
  tag_rare: '🍺',
  tag_ghost: '👻',
  tag_icy: '❄️',
  tag_fire: '🔥',
  tag_holy: '✝️',
  tag_investment: '💰',
  tag_permit: '📜',
  tag_boss: '🔄',
  tag_dice_mega: '🎲',
  tag_supply_mega: '📦',
  tag_trail_guide_mega: '🗺️',
  tag_equipment_mega: '🔧',
  tag_frontier: '👁️',
  tag_well_traveled: '🥾',
  tag_pack_rat: '🐀',
  tag_company_store: '🏪',
  tag_twin_wagon: '🔁',
  tag_wide_saddle: '🐎',
};

export function getTagIcon(tagId: string): string {
  return TAG_ICONS[tagId] ?? '🏷️';
}

export function getTagStackAnchor(metrics: GameScenePixiLayoutMetrics): { x: number; y: number } {
  const { pouchX, pouchY } = metrics.tagStack;
  const stackBottom = pouchY - UI.POUCH_SIZE - TAG_STACK.POUCH_CLEARANCE;
  return { x: pouchX + TAG_STACK.BADGE_SIZE / 2, y: stackBottom - TAG_STACK.BADGE_SIZE / 2 };
}
