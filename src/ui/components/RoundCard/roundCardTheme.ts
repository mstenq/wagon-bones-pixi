import { TextStyle } from "pixi.js";

import {
  NEO_BORDER_COLOR,
  NEO_BORDER_WIDTH_PX,
  NEO_RADIUS_PX,
  NEO_SHADOW_OFFSET_X,
  NEO_SHADOW_OFFSET_Y,
  TAILWIND_500_HEX,
  UI_FONT_BODY,
  UI_FONT_HEADER,
} from "@/ui/theme/uiTokens";
import { hexToPixiColor } from "@/ui/pixi/color";

export const ROUND_CARD_STATUSES = [
  "complete",
  "select",
  "upcoming",
  "skipped",
] as const;

export type RoundCardStatus = (typeof ROUND_CARD_STATUSES)[number];

export type RoundCardProps = {
  status: RoundCardStatus;
  title: string;
  /** Reserved for future Sprite art; circle placeholder is drawn when omitted. */
  image?: string;
  targetScore: number;
  rewardAmount: number;
  trailTag?: string;
  x?: number;
  y?: number;
  onPlayRound?: () => void;
  onSkipRound?: () => void;
};

export type RoundCardStatusTheme = {
  statusLabel: string;
  statusLabelColor: number;
  faceColor: number;
  accentStrokeColor: number | null;
  placeholderColor: number;
};

export const DEFAULT_ROUND_CARD_WIDTH = 200;
export const DEFAULT_ROUND_CARD_HEIGHT = 400;
export const ROUND_CARD_CORNER_RADIUS = NEO_RADIUS_PX;
export const ROUND_CARD_BORDER_WIDTH = NEO_BORDER_WIDTH_PX;
export const ROUND_CARD_BORDER_COLOR = NEO_BORDER_COLOR;
export const ROUND_CARD_SHADOW_OFFSET_X = NEO_SHADOW_OFFSET_X;
export const ROUND_CARD_SHADOW_OFFSET_Y = NEO_SHADOW_OFFSET_Y;

export const ROUND_CARD_PADDING_X = 16;
export const ROUND_CARD_PLAY_BUTTON_HEIGHT = 44;
export const ROUND_CARD_SKIP_BUTTON_HEIGHT = 36;
export const ROUND_CARD_SKIP_BUTTON_WIDTH = 120;
export const ROUND_CARD_TRAIL_TAG_SIZE = 36;

export const ROUND_CARD_PLACEHOLDER_RADIUS = 36;

const FACE_DEFAULT_HEX = "#1a1f21";
const FACE_SELECT_HEX = "#1a2a1f";
const TEXT_MUTED_HEX = "#9ca3af";
const TEXT_ON_DARK_HEX = "#f3f4f6";

export const ROUND_CARD_TITLE_COLOR = hexToPixiColor(TEXT_ON_DARK_HEX);
export const ROUND_CARD_SCORE_LABEL_COLOR = hexToPixiColor(TEXT_MUTED_HEX);
export const ROUND_CARD_TARGET_SCORE_COLOR = hexToPixiColor(TAILWIND_500_HEX.green);
export const ROUND_CARD_REWARD_POSITIVE_COLOR = hexToPixiColor(TAILWIND_500_HEX.yellow);
export const ROUND_CARD_REWARD_NEGATIVE_COLOR = hexToPixiColor(TAILWIND_500_HEX.red);
export const ROUND_CARD_SKIPPED_OVERLAY_COLOR = hexToPixiColor(TAILWIND_500_HEX.red);
export const ROUND_CARD_SKIP_FACE_COLOR = hexToPixiColor(TAILWIND_500_HEX.red);
export const ROUND_CARD_TRAIL_TAG_FACE_COLOR = hexToPixiColor(TAILWIND_500_HEX.cyan);

const STATUS_THEMES: Record<RoundCardStatus, RoundCardStatusTheme> = {
  complete: {
    statusLabel: "Complete",
    statusLabelColor: hexToPixiColor(TAILWIND_500_HEX.green),
    faceColor: hexToPixiColor(FACE_DEFAULT_HEX),
    accentStrokeColor: null,
    placeholderColor: hexToPixiColor(TAILWIND_500_HEX.purple),
  },
  select: {
    statusLabel: "Select",
    statusLabelColor: hexToPixiColor(TAILWIND_500_HEX.orange),
    faceColor: hexToPixiColor(FACE_SELECT_HEX),
    accentStrokeColor: hexToPixiColor(TAILWIND_500_HEX.orange),
    placeholderColor: hexToPixiColor(TAILWIND_500_HEX.green),
  },
  upcoming: {
    statusLabel: "Upcoming",
    statusLabelColor: hexToPixiColor(TEXT_MUTED_HEX),
    faceColor: hexToPixiColor(FACE_DEFAULT_HEX),
    accentStrokeColor: null,
    placeholderColor: hexToPixiColor(TAILWIND_500_HEX.sky),
  },
  skipped: {
    statusLabel: "Skipped",
    statusLabelColor: hexToPixiColor(TAILWIND_500_HEX.red),
    faceColor: hexToPixiColor(FACE_DEFAULT_HEX),
    accentStrokeColor: null,
    placeholderColor: hexToPixiColor("#6b7280"),
  },
};

export function getRoundCardStatusTheme(status: RoundCardStatus): RoundCardStatusTheme {
  return STATUS_THEMES[status];
}

export function roundCardContentWidth(cardWidth: number): number {
  return cardWidth - ROUND_CARD_PADDING_X * 2;
}

export function roundCardLayout(cardWidth: number, cardHeight: number) {
  const top = -cardHeight / 2;
  return {
    statusY: top + 22,
    titleY: top + 52,
    placeholderY: top + 108,
    scoreLabelY: top + 168,
    targetScoreY: top + 198,
    rewardY: top + 232,
    playButtonY: cardHeight / 2 - 108,
    skipRowY: cardHeight / 2 - 54,
  };
}

export function statusLabelTextStyle(color: number): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 14,
    fill: color,
    align: "center",
  });
}

export function titleTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_HEADER,
    fontSize: 22,
    fill: ROUND_CARD_TITLE_COLOR,
    align: "center",
    wordWrap: true,
    wordWrapWidth: DEFAULT_ROUND_CARD_WIDTH - ROUND_CARD_PADDING_X * 2,
  });
}

export function scoreLabelTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 13,
    fill: ROUND_CARD_SCORE_LABEL_COLOR,
    align: "center",
  });
}

export function targetScoreTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_HEADER,
    fontSize: 26,
    fill: ROUND_CARD_TARGET_SCORE_COLOR,
    align: "center",
  });
}

export function rewardTextStyle(color: number): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 13,
    fill: color,
    align: "center",
    wordWrap: true,
    wordWrapWidth: DEFAULT_ROUND_CARD_WIDTH - ROUND_CARD_PADDING_X * 2,
  });
}

export function skippedOverlayTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_HEADER,
    fontSize: 36,
    fill: ROUND_CARD_SKIPPED_OVERLAY_COLOR,
    align: "center",
    fontWeight: "700",
  });
}

export function trailTagTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 14,
    fill: 0x000000,
    align: "center",
  });
}

export function skipButtonLabelTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 14,
    fill: 0xffffff,
    align: "center",
  });
}
