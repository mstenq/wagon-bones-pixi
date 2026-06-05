import { describe, expect, test } from 'bun:test';

import { buildCardBarRowLayout, getCardBarSpacing } from '@/ui/components/CardBar/cardBarLayout';
import { CONSUMABLE_CARD_BAR_THEME } from '@/ui/components/CardBar/cardBarTheme';

describe('getCardBarSpacing', () => {
  test('returns 0 for a single card', () => {
    expect(getCardBarSpacing(1, 194, 16, 100, 130)).toBe(0);
  });

  test('compresses center-to-center spacing when the bar is full', () => {
    const spacing = getCardBarSpacing(2, 194, 16, 99.75, 130);
    expect(spacing).toBeCloseTo(62.25, 2);
    expect(spacing).toBeLessThan(99.75);
  });
});

describe('buildCardBarRowLayout', () => {
  test('keeps overlapping consumable cards inside the bar', () => {
    const bar = { w: 194, h: 250 };
    const theme = CONSUMABLE_CARD_BAR_THEME;
    const layout = buildCardBarRowLayout(bar, 2, theme);

    const cardWidth = theme.cardWidth;
    const leftEdge = layout.originX - cardWidth / 2;
    const rightEdge = layout.originX + layout.pitch + cardWidth / 2;

    expect(layout.pitch).toBeCloseTo(62.25, 2);
    expect(leftEdge).toBeGreaterThanOrEqual(theme.barPadding - 0.5);
    expect(rightEdge).toBeLessThanOrEqual(bar.w - theme.barPadding + 0.5);
  });
});
