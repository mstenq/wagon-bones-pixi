import { TextStyle } from 'pixi.js';
import type { Graphics } from 'pixi.js';
import { useCallback, useMemo, useRef, useState } from 'react';

import { COLORS, FONTS, TAG_STACK, TEXT_COLORS, UI } from '@/game/Constants';
import { resolveTagDescription } from '@/data/trail_tags';
import type { TrailTagInstance } from '@/game/types';
import { useRunStoreRevision } from '@/game/store/reactHooks';
import { selectTagStackModel, selectTagStackSnapshot } from '@/game/store/selectors/uiSelectors';
import { getTagIcon, TAG_COLORS } from '@/ui/components/gameScene/tagStackTheme';
import type { GameScenePixiLayoutMetrics } from '@/ui/layout/gameScenePixiLayout';

export type TagStackProps = {
  metrics: GameScenePixiLayoutMetrics;
};

const { BADGE_SIZE, BADGE_GAP, BADGE_RADIUS, TOOLTIP_WIDTH } = TAG_STACK;

const copyStyle = new TextStyle({
  fontFamily: FONTS.PRIMARY,
  fontSize: 9,
  fill: '#ffffff',
});

const iconStyle = new TextStyle({
  fontSize: 16,
});

const tooltipTitleStyle = new TextStyle({
  fontFamily: FONTS.HEADING,
  fontSize: 13,
  fill: TEXT_COLORS.GOLD,
});

const tooltipBodyStyle = new TextStyle({
  fontFamily: FONTS.PRIMARY,
  fontSize: 10,
  fill: TEXT_COLORS.SECONDARY,
  wordWrap: true,
  wordWrapWidth: TOOLTIP_WIDTH - 16,
});

type TooltipState = {
  title: string;
  body: string;
  x: number;
  y: number;
};

type TagBadgeProps = {
  tag: TrailTagInstance;
  x: number;
  y: number;
  onHover: (tooltip: TooltipState | null) => void;
};

function TagBadge({ tag, x, y, onHover }: TagBadgeProps) {
  const gfxRef = useRef<Graphics | null>(null);
  const [hovered, setHovered] = useState(false);
  const color = TAG_COLORS[tag.def.category] ?? 0x888888;

  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.fill({ color, alpha: hovered ? 1 : 0.9 });
      graphics.roundRect(0, 0, BADGE_SIZE, BADGE_SIZE, BADGE_RADIUS);
      graphics.fill();
      graphics.stroke({ color: 0xffffff, width: hovered ? 2 : 1, alpha: hovered ? 0.6 : 0.3 });
      graphics.roundRect(0, 0, BADGE_SIZE, BADGE_SIZE, BADGE_RADIUS);
      graphics.stroke();
    },
    [color, hovered],
  );

  const showTooltip = useCallback(() => {
    setHovered(true);
    onHover({
      title: tag.def.name,
      body: resolveTagDescription(tag.def, { surveyorHand: tag.surveyorHand }),
      x: x - TOOLTIP_WIDTH - 8,
      y,
    });
  }, [onHover, tag, x, y]);

  const hideTooltip = useCallback(() => {
    setHovered(false);
    onHover(null);
  }, [onHover]);

  return (
    <pixiContainer
      x={x}
      y={y}
      zIndex={150}
      eventMode="static"
      onPointerOver={showTooltip}
      onPointerOut={hideTooltip}
    >
      <pixiGraphics ref={gfxRef} draw={draw} eventMode="none" />
      <pixiText
        text={getTagIcon(tag.def.id)}
        style={iconStyle}
        anchor={0.5}
        x={BADGE_SIZE / 2}
        y={BADGE_SIZE / 2 - 2}
        eventMode="none"
      />
      {tag.copies > 1 ? (
        <>
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.fill({ color: COLORS.ERROR_RED });
              g.circle(BADGE_SIZE - 4, 4, 8);
              g.fill();
            }}
            eventMode="none"
          />
          <pixiText
            text={`×${tag.copies}`}
            style={copyStyle}
            anchor={0.5}
            x={BADGE_SIZE - 4}
            y={4}
            eventMode="none"
          />
        </>
      ) : null}
    </pixiContainer>
  );
}

type TwinWagonBadgeProps = {
  count: number;
  x: number;
  y: number;
  onHover: (tooltip: TooltipState | null) => void;
};

function TwinWagonBadge({ count, x, y, onHover }: TwinWagonBadgeProps) {
  const twinStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONTS.HEADING,
        fontSize: 16,
        fill: '#ffdd44',
      }),
    [],
  );

  const showTooltip = useCallback(() => {
    onHover({
      title: 'Twin Wagon',
      body: `Your next round will be played twice. (${count + 1}× total)`,
      x: x - TOOLTIP_WIDTH - 8,
      y,
    });
  }, [count, onHover, x, y]);

  const hideTooltip = useCallback(() => {
    onHover(null);
  }, [onHover]);

  return (
    <pixiContainer
      x={x}
      y={y}
      zIndex={150}
      eventMode="static"
      onPointerOver={showTooltip}
      onPointerOut={hideTooltip}
    >
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.fill({ color: 0xcccccc, alpha: 0.9 });
          g.roundRect(0, 0, BADGE_SIZE, BADGE_SIZE, BADGE_RADIUS);
          g.fill();
          g.stroke({ color: 0xffdd44, width: 2, alpha: 0.8 });
          g.roundRect(0, 0, BADGE_SIZE, BADGE_SIZE, BADGE_RADIUS);
          g.stroke();
        }}
        eventMode="none"
      />
      <pixiText text={`×${count + 1}`} style={twinStyle} anchor={0.5} x={BADGE_SIZE / 2} y={BADGE_SIZE / 2} eventMode="none" />
    </pixiContainer>
  );
}

export function TagStack({ metrics }: TagStackProps) {
  const model = useRunStoreRevision(selectTagStackSnapshot, selectTagStackModel);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const { pouchX, pouchY } = metrics.tagStack;
  const stackBottom = pouchY - UI.POUCH_SIZE - TAG_STACK.POUCH_CLEARANCE;

  if (model.tags.length === 0 && model.twinWagonCount === 0) {
    return null;
  }

  return (
    <pixiContainer sortableChildren eventMode="passive">
      {model.tags.map((tag, index) => {
        const badgeY = stackBottom - (index + 1) * (BADGE_SIZE + BADGE_GAP);
        return (
          <TagBadge key={`${tag.def.id}-${index}`} tag={tag} x={pouchX} y={badgeY} onHover={setTooltip} />
        );
      })}
      {model.twinWagonCount > 0 ? (
        <TwinWagonBadge
          count={model.twinWagonCount}
          x={pouchX}
          y={stackBottom - (model.tags.length + 1) * (BADGE_SIZE + BADGE_GAP)}
          onHover={setTooltip}
        />
      ) : null}
      {tooltip ? (
        <pixiContainer x={tooltip.x} y={tooltip.y} zIndex={200} eventMode="none">
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.fill({ color: COLORS.TOOLTIP_BG, alpha: 0.95 });
              g.roundRect(0, 0, TOOLTIP_WIDTH, 60, 8);
              g.fill();
              g.stroke({ color: 0x444466, width: 1, alpha: 0.8 });
              g.roundRect(0, 0, TOOLTIP_WIDTH, 60, 8);
              g.stroke();
            }}
            eventMode="none"
          />
          <pixiText text={tooltip.title} style={tooltipTitleStyle} x={8} y={6} eventMode="none" />
          <pixiText text={tooltip.body} style={tooltipBodyStyle} x={8} y={24} eventMode="none" />
        </pixiContainer>
      ) : null}
    </pixiContainer>
  );
}
