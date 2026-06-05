import { TextStyle } from 'pixi.js';

import { TEXT_COLORS } from '@/game/Constants';
import type { TrailEventCategory } from '@/data/trail_events';
import { TAILWIND_500_HEX, UI_FONT_BODY, UI_FONT_HEADER } from '@/ui/theme/uiTokens';
import { hexToPixiColor } from '@/ui/pixi/color';

export const TRAIL_EVENT_PANEL_FACE_HEX = '#1a1f21';

const CATEGORY_HEX: Record<TrailEventCategory, string> = {
  positive: TAILWIND_500_HEX.green,
  wagon_damage: TAILWIND_500_HEX.orange,
  weather: TAILWIND_500_HEX.sky,
  animal: TAILWIND_500_HEX.lime,
  bandits: TAILWIND_500_HEX.red,
  navigation: TAILWIND_500_HEX.purple,
  water: TAILWIND_500_HEX.cyan,
  stranger: TAILWIND_500_HEX.amber,
  uneventful: '#6b7280',
  demon_hunter: TAILWIND_500_HEX.fuchsia,
};

export function trailEventCategoryColor(category: TrailEventCategory): number {
  return hexToPixiColor(CATEGORY_HEX[category] ?? TAILWIND_500_HEX.indigo);
}

export const TRAIL_EVENT_PANEL_FACE_COLOR = hexToPixiColor(TRAIL_EVENT_PANEL_FACE_HEX);
export const TRAIL_EVENT_TITLE_COLOR = hexToPixiColor(TEXT_COLORS.PRIMARY);
export const TRAIL_EVENT_BODY_COLOR = hexToPixiColor(TEXT_COLORS.SECONDARY);
export const TRAIL_EVENT_MUTED_COLOR = hexToPixiColor(TEXT_COLORS.MUTED);
export const TRAIL_EVENT_POSITIVE_COLOR = hexToPixiColor(TEXT_COLORS.SCORE_GREEN);
export const TRAIL_EVENT_NEGATIVE_COLOR = hexToPixiColor(TEXT_COLORS.ERROR_RED);
export const TRAIL_EVENT_GOLD_COLOR = hexToPixiColor(TEXT_COLORS.GOLD);

export function trailEventTitleTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_HEADER,
    fontSize: 26,
    fill: TRAIL_EVENT_TITLE_COLOR,
    align: 'center',
    wordWrap: true,
  });
}

export function trailEventDescriptionTextStyle(panelWidth: number): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 16,
    fill: TRAIL_EVENT_BODY_COLOR,
    align: 'center',
    wordWrap: true,
    wordWrapWidth: panelWidth - 48,
    lineHeight: 22,
  });
}

export function trailEventSpyTitleTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_HEADER,
    fontSize: 24,
    fill: hexToPixiColor('#111827'),
    align: 'center',
  });
}

export function trailEventSpyHintTextStyle(contentWidth: number): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 14,
    fill: hexToPixiColor('#374151'),
    align: 'center',
    wordWrap: true,
    wordWrapWidth: contentWidth - 48,
    lineHeight: 20,
  });
}

export function trailEventResultMessageTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 16,
    fontStyle: 'italic',
    fill: TRAIL_EVENT_BODY_COLOR,
    align: 'center',
  });
}

export function trailEventEffectTextStyle(color: number): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 15,
    fill: color,
    align: 'center',
  });
}

export function trailEventProtectionTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_HEADER,
    fontSize: 16,
    fill: TRAIL_EVENT_GOLD_COLOR,
    align: 'center',
  });
}

export function trailEventSacrificePromptTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_HEADER,
    fontSize: 16,
    fill: TRAIL_EVENT_NEGATIVE_COLOR,
    align: 'center',
  });
}
