import type { TrailEventChoice } from '@/data/trail_events';

const PANEL_MAX_WIDTH = 560;
const PANEL_SIDE_MARGIN = 40;
const PANEL_TOP_PADDING = 20;
const PANEL_BOTTOM_PADDING = 24;
const IMAGE_MAX_HEIGHT = 160;
const IMAGE_TOP_GAP = 20;
const NAME_GAP = 8;
const DESC_GAP = 16;
const CHOICES_GAP = 28;
const CHOICE_HEIGHT = 44;
const CHOICE_GAP = 12;
const BUTTON_WIDTH = 380;
const BUTTON_HEIGHT = 44;

export type TrailEventPanelLayout = {
  contentCX: number;
  panel: {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
  };
  imageY: number;
  imageMaxHeight: number;
  nameY: number;
  descriptionY: number;
  choicesStartY: number;
  choiceButtonWidth: number;
  choiceButtonHeight: number;
  choiceButtonGap: number;
};

export type SpyglassPreviewLayout = {
  contentCX: number;
  titleY: number;
  hintY: number;
  circleCenterY: number;
  viewRadius: number;
  avoidButtonY: number;
  investigateButtonY: number;
  buttonWidth: number;
  buttonHeight: number;
};

export type TrailEventResultLayout = {
  contentCX: number;
  resultStartY: number;
  continueButtonY: number;
  buttonWidth: number;
  buttonHeight: number;
};

function estimateDescriptionHeight(description: string, panelWidth: number): number {
  const charsPerLine = Math.max(24, Math.floor((panelWidth - 48) / 9));
  const lines = Math.max(1, Math.ceil(description.length / charsPerLine));
  return lines * 22;
}

export function computeTrailEventPanelLayout(
  contentW: number,
  contentH: number,
  description: string,
  choiceCount: number,
): TrailEventPanelLayout {
  const contentCX = contentW / 2;
  const panelW = Math.min(PANEL_MAX_WIDTH, contentW - PANEL_SIDE_MARGIN);
  const imageBlockHeight = IMAGE_TOP_GAP + IMAGE_MAX_HEIGHT + 16;
  const nameBlockHeight = 32;
  const descriptionHeight = estimateDescriptionHeight(description, panelW);
  const choicesBlockHeight =
    choiceCount > 0 ? CHOICES_GAP + choiceCount * CHOICE_HEIGHT + (choiceCount - 1) * CHOICE_GAP : 0;

  const panelH =
    PANEL_TOP_PADDING +
    imageBlockHeight +
    NAME_GAP +
    nameBlockHeight +
    DESC_GAP +
    descriptionHeight +
    choicesBlockHeight +
    PANEL_BOTTOM_PADDING;

  const panelTop = Math.max(16, contentH / 2 - panelH / 2);
  const imageY = panelTop + PANEL_TOP_PADDING + IMAGE_TOP_GAP;
  const nameY = imageY + IMAGE_MAX_HEIGHT + 16 + NAME_GAP;
  const descriptionY = nameY + nameBlockHeight + DESC_GAP;
  const choicesStartY = descriptionY + descriptionHeight + CHOICES_GAP;

  return {
    contentCX,
    panel: {
      centerX: contentCX,
      centerY: panelTop + panelH / 2,
      width: panelW,
      height: panelH,
    },
    imageY: imageY + IMAGE_MAX_HEIGHT / 2,
    imageMaxHeight: IMAGE_MAX_HEIGHT,
    nameY,
    descriptionY,
    choicesStartY,
    choiceButtonWidth: Math.min(BUTTON_WIDTH, panelW - 60),
    choiceButtonHeight: BUTTON_HEIGHT,
    choiceButtonGap: CHOICE_GAP,
  };
}

export function computeSpyglassPreviewLayout(contentW: number, contentH: number, viewRadius: number): SpyglassPreviewLayout {
  const contentCX = contentW / 2;
  const controlsH = 112;
  const titleY = 12;
  const hintY = 40;
  const circleCenterY = 72 + viewRadius;
  const investigateButtonY = Math.min(contentH - 44, contentH - controlsH + 52);
  const avoidButtonY = investigateButtonY - 52;

  return {
    contentCX,
    titleY,
    hintY,
    circleCenterY,
    viewRadius,
    avoidButtonY,
    investigateButtonY,
    buttonWidth: Math.min(360, contentW - 48),
    buttonHeight: BUTTON_HEIGHT,
  };
}

export function computeTrailEventResultLayout(
  contentW: number,
  contentH: number,
  panelBottomY: number,
  effectLineCount: number,
  hasProtectionText: boolean,
  hasMessage: boolean,
): TrailEventResultLayout {
  const contentCX = contentW / 2;
  let resultStartY = panelBottomY + 24;

  if (hasProtectionText) {
    resultStartY += 8;
  }
  if (hasMessage) {
    resultStartY += 8;
  }

  const resultBlockHeight = (hasProtectionText ? 28 : 0) + (hasMessage ? 30 : 0) + effectLineCount * 24;
  const continueButtonY = Math.min(resultStartY + resultBlockHeight + 48, contentH - 36);

  return {
    contentCX,
    resultStartY,
    continueButtonY,
    buttonWidth: 220,
    buttonHeight: BUTTON_HEIGHT,
  };
}

export function choiceButtonY(layout: TrailEventPanelLayout, index: number): number {
  return layout.choicesStartY + index * (layout.choiceButtonHeight + layout.choiceButtonGap) + layout.choiceButtonHeight / 2;
}

export type { TrailEventChoice };
