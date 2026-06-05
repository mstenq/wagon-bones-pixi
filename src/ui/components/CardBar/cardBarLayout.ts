import type { ReorderableRowLayout } from '@/ui/interaction/useReorderableRow';

import type { CardBarTheme } from '@/ui/components/CardBar/cardBarTheme';

/** Center-to-center spacing; compresses when the bar is full (Phaser `getCardSpacing`). */
export function getCardBarSpacing(
  count: number,
  barWidth: number,
  barPadding: number,
  cardWidth: number,
  preferredSpacing: number,
): number {
  if (count <= 1) {
    return 0;
  }
  const availableW = barWidth - barPadding * 2 - cardWidth;
  const neededW = (count - 1) * preferredSpacing;
  if (neededW <= availableW) {
    return preferredSpacing;
  }
  return availableW / (count - 1);
}

/** Phaser CardBar layout: card centers at `startX + index * spacing` (spacing may be < card width). */
export function buildCardBarRowLayout(
  bar: { w: number; h: number },
  count: number,
  theme: CardBarTheme,
): ReorderableRowLayout {
  const rowY = bar.h / 2 - theme.verticalOffset;

  if (count <= 0) {
    return {
      pitch: theme.cardWidth,
      originX: bar.w / 2,
      rowWidth: theme.cardWidth,
      rowY,
      count: 0,
    };
  }

  const spacing =
    count <= 1
      ? 0
      : getCardBarSpacing(count, bar.w, theme.barPadding, theme.cardWidth, theme.preferredSpacing);
  const totalW = (count - 1) * spacing;
  const startX = bar.w / 2 - totalW / 2;
  const pitch = count <= 1 ? theme.cardWidth : spacing;
  const rowWidth = count <= 1 ? theme.cardWidth : (count - 1) * spacing + theme.cardWidth;

  return {
    pitch,
    originX: startX,
    rowWidth,
    rowY,
    count,
  };
}
