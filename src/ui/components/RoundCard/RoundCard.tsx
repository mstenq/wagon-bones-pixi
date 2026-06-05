import { useTick } from "@pixi/react";
import { useMemo, useRef } from "react";
import type { Graphics } from "pixi.js";

import { Button } from "@/ui/components/Button/Button";
import { formatRewardLine, formatRoundScore } from "@/ui/components/RoundCard/roundCardFormat";
import { RoundCardSkipButton } from "@/ui/components/RoundCard/RoundCardSkipButton";
import {
  DEFAULT_ROUND_CARD_HEIGHT,
  DEFAULT_ROUND_CARD_WIDTH,
  getRoundCardStatusTheme,
  rewardTextStyle,
  roundCardContentWidth,
  roundCardLayout,
  ROUND_CARD_PLAY_BUTTON_HEIGHT,
  ROUND_CARD_PLACEHOLDER_RADIUS,
  ROUND_CARD_REWARD_NEGATIVE_COLOR,
  ROUND_CARD_REWARD_POSITIVE_COLOR,
  ROUND_CARD_SKIP_BUTTON_HEIGHT,
  ROUND_CARD_SKIP_BUTTON_WIDTH,
  ROUND_CARD_TRAIL_TAG_FACE_COLOR,
  ROUND_CARD_TRAIL_TAG_SIZE,
  scoreLabelTextStyle,
  skippedOverlayTextStyle,
  statusLabelTextStyle,
  targetScoreTextStyle,
  titleTextStyle,
  trailTagTextStyle,
  type RoundCardProps,
} from "@/ui/components/RoundCard/roundCardTheme";
import {
  drawNeoChipFace,
  drawNeoChipShadow,
  drawPlaceholderCircle,
  drawRoundCardFace,
  drawRoundCardShadow,
} from "@/ui/components/RoundCard/roundCardVisuals";
import { useUiPrimary } from "@/ui/theme/UiPrimaryProvider";

export type { RoundCardProps, RoundCardStatus } from "@/ui/components/RoundCard/roundCardTheme";
export { ROUND_CARD_STATUSES } from "@/ui/components/RoundCard/roundCardTheme";

export function RoundCard({
  status,
  title,
  image: _image,
  targetScore,
  rewardAmount,
  trailTag,
  x = 0,
  y = 0,
  onPlayRound,
  onSkipRound,
}: RoundCardProps) {
  useUiPrimary();

  const cardWidth = DEFAULT_ROUND_CARD_WIDTH;
  const cardHeight = DEFAULT_ROUND_CARD_HEIGHT;
  const statusTheme = getRoundCardStatusTheme(status);
  const layout = roundCardLayout(cardWidth, cardHeight);
  const contentWidth = roundCardContentWidth(cardWidth);

  const shadowRef = useRef<Graphics | null>(null);
  const faceRef = useRef<Graphics | null>(null);
  const placeholderRef = useRef<Graphics | null>(null);
  const trailTagShadowRef = useRef<Graphics | null>(null);
  const trailTagFaceRef = useRef<Graphics | null>(null);

  const formattedScore = formatRoundScore(targetScore);
  const rewardLine = formatRewardLine(rewardAmount);
  const rewardIsNegative = rewardAmount <= 0;
  const showActions = status === "select";
  const showSkippedOverlay = status === "skipped";

  const statusStyle = useMemo(
    () => statusLabelTextStyle(statusTheme.statusLabelColor),
    [statusTheme.statusLabelColor],
  );
  const titleStyle = useMemo(() => titleTextStyle(), []);
  const scoreStyle = useMemo(() => scoreLabelTextStyle(), []);
  const targetStyle = useMemo(() => targetScoreTextStyle(), []);
  const rewardStyle = useMemo(
    () =>
      rewardTextStyle(
        rewardIsNegative ? ROUND_CARD_REWARD_NEGATIVE_COLOR : ROUND_CARD_REWARD_POSITIVE_COLOR,
      ),
    [rewardIsNegative],
  );
  const skippedStyle = useMemo(() => skippedOverlayTextStyle(), []);
  const trailStyle = useMemo(() => trailTagTextStyle(), []);

  const skipRowGap = 8;
  let trailTagX = 0;
  let skipButtonX = 0;
  if (trailTag) {
    const rowWidth =
      ROUND_CARD_TRAIL_TAG_SIZE + skipRowGap + ROUND_CARD_SKIP_BUTTON_WIDTH;
    trailTagX = -rowWidth / 2 + ROUND_CARD_TRAIL_TAG_SIZE / 2;
    skipButtonX = rowWidth / 2 - ROUND_CARD_SKIP_BUTTON_WIDTH / 2;
  }

  useTick(() => {
    if (shadowRef.current) {
      drawRoundCardShadow(shadowRef.current, cardWidth, cardHeight);
    }
    if (faceRef.current) {
      drawRoundCardFace(faceRef.current, cardWidth, cardHeight, statusTheme);
    }
    if (placeholderRef.current) {
      drawPlaceholderCircle(
        placeholderRef.current,
        0,
        0,
        ROUND_CARD_PLACEHOLDER_RADIUS,
        statusTheme.placeholderColor,
      );
    }
    if (trailTagShadowRef.current) {
      drawNeoChipShadow(
        trailTagShadowRef.current,
        ROUND_CARD_TRAIL_TAG_SIZE,
        ROUND_CARD_TRAIL_TAG_SIZE,
      );
    }
    if (trailTagFaceRef.current) {
      drawNeoChipFace(
        trailTagFaceRef.current,
        ROUND_CARD_TRAIL_TAG_SIZE,
        ROUND_CARD_TRAIL_TAG_SIZE,
        ROUND_CARD_TRAIL_TAG_FACE_COLOR,
      );
    }
  });

  return (
    <pixiContainer x={x} y={y} sortableChildren eventMode="passive">
      <pixiGraphics ref={shadowRef} zIndex={0} eventMode="none" draw={() => {}} />
      <pixiContainer zIndex={1} sortableChildren eventMode="passive">
        <pixiGraphics ref={faceRef} eventMode="none" draw={() => {}} />

        <pixiText
          text={statusTheme.statusLabel}
          style={statusStyle}
          anchor={{ x: 0.5, y: 0 }}
          y={layout.statusY}
          eventMode="none"
        />

        <pixiText
          text={title}
          style={titleStyle}
          anchor={0.5}
          y={layout.titleY}
          eventMode="none"
        />

        <pixiGraphics
          ref={placeholderRef}
          y={layout.placeholderY}
          eventMode="none"
          draw={() => {}}
        />

        <pixiText
          text="Score at least"
          style={scoreStyle}
          anchor={0.5}
          y={layout.scoreLabelY}
          eventMode="none"
        />

        <pixiText
          text={formattedScore}
          style={targetStyle}
          anchor={0.5}
          y={layout.targetScoreY}
          eventMode="none"
        />

        <pixiText
          text={rewardLine}
          style={rewardStyle}
          anchor={0.5}
          y={layout.rewardY}
          eventMode="none"
        />

        {showActions ? (
          <>
            <Button
              variant="primary"
              label="Play Round"
              x={0}
              y={layout.playButtonY}
              width={contentWidth}
              height={ROUND_CARD_PLAY_BUTTON_HEIGHT}
              onClick={onPlayRound}
            />

            {trailTag ? (
              <pixiContainer
                x={trailTagX}
                y={layout.skipRowY}
                sortableChildren
                eventMode="none"
              >
                <pixiGraphics
                  ref={trailTagShadowRef}
                  zIndex={0}
                  eventMode="none"
                  draw={() => {}}
                />
                <pixiContainer zIndex={1} eventMode="none">
                  <pixiGraphics
                    ref={trailTagFaceRef}
                    eventMode="none"
                    draw={() => {}}
                  />
                  <pixiText
                    text={trailTag}
                    style={trailStyle}
                    anchor={0.5}
                    eventMode="none"
                  />
                </pixiContainer>
              </pixiContainer>
            ) : null}

            <RoundCardSkipButton
              label="Skip Round"
              x={skipButtonX}
              y={layout.skipRowY}
              width={ROUND_CARD_SKIP_BUTTON_WIDTH}
              height={ROUND_CARD_SKIP_BUTTON_HEIGHT}
              onClick={onSkipRound}
            />
          </>
        ) : null}

        {showSkippedOverlay ? (
          <pixiText
            text="Skipped"
            style={skippedStyle}
            anchor={0.5}
            rotation={-Math.PI / 4}
            zIndex={10}
            eventMode="none"
          />
        ) : null}
      </pixiContainer>
    </pixiContainer>
  );
}
