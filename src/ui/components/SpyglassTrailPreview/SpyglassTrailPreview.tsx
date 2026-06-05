import { use, useCallback, useMemo, useRef } from 'react';
import { useTick } from '@pixi/react';
import type { Container, Graphics } from 'pixi.js';
import { Rectangle, Texture as PixiTexture } from 'pixi.js';

import { loadTrailEventSpyTexture } from '@/loaders/trailEvents/textures';
import { TRAIL_EVENT } from '@/game/Constants';
import { computeCoverCrop } from '@/game/trailEventAssets';
import { Button } from '@/ui/components/Button/Button';
import { drawSpyglassRing } from '@/ui/components/TrailEventPanel/trailEventPanelVisuals';
import { computeSpyglassPreviewLayout } from '@/ui/trailEvent/trailEventLayout';
import {
  trailEventSpyHintTextStyle,
  trailEventSpyTitleTextStyle,
} from '@/ui/trailEvent/trailEventTheme';
import {
  avoidTrailEventWithSpyglass,
  getSpyglassInvestigateLabel,
  investigateTrailEventWithSpyglass,
} from '@/ui/trailEvent/trailEventActions';

export type SpyglassTrailPreviewProps = {
  eventId: string;
  contentW: number;
  contentH: number;
};

function computeViewRadius(contentW: number, contentH: number): number {
  const controlsH = 112;
  const maxDiameter = Math.min(contentW - 48, contentH - controlsH - 88);
  return Math.min(TRAIL_EVENT.SPYGLASS_VIEW_RADIUS, maxDiameter / 2);
}

function SpyglassCircleImage({
  eventId,
  centerX,
  centerY,
  diameter,
}: {
  eventId: string;
  centerX: number;
  centerY: number;
  diameter: number;
}) {
  const texture = use(loadTrailEventSpyTexture(eventId));
  const maskRef = useRef<Graphics | null>(null);
  const containerRef = useRef<Container | null>(null);

  const bindContainer = useCallback((node: Container | null) => {
    containerRef.current = node;
    if (node && maskRef.current) {
      node.mask = maskRef.current;
    }
  }, []);

  const bindMask = useCallback((node: Graphics | null) => {
    maskRef.current = node;
    if (containerRef.current && node) {
      containerRef.current.mask = node;
    }
  }, []);

  if (texture === PixiTexture.EMPTY || texture.width <= 0) {
    return null;
  }

  const { cropX, cropY, cropW, cropH } = computeCoverCrop(texture.width, texture.height, diameter, diameter);
  const frame = new Rectangle(cropX, cropY, cropW, cropH);
  const cropped = new PixiTexture({ source: texture.source, frame });

  return (
    <pixiContainer ref={bindContainer} x={centerX} y={centerY} eventMode="none">
      <pixiSprite texture={cropped} width={diameter} height={diameter} anchor={0.5} x={0} y={0} eventMode="none" />
      <pixiGraphics
        ref={bindMask}
        draw={(graphics) => {
          graphics.clear();
          graphics.circle(0, 0, diameter / 2);
          graphics.fill({ color: 0xffffff });
        }}
        eventMode="none"
      />
    </pixiContainer>
  );
}

export function SpyglassTrailPreview({ eventId, contentW, contentH }: SpyglassTrailPreviewProps) {
  const ringRef = useRef<Graphics | null>(null);
  const viewRadius = computeViewRadius(contentW, contentH);

  const layout = useMemo(
    () => computeSpyglassPreviewLayout(contentW, contentH, viewRadius),
    [contentH, contentW, viewRadius],
  );

  const titleStyle = useMemo(() => trailEventSpyTitleTextStyle(), []);
  const hintStyle = useMemo(() => trailEventSpyHintTextStyle(contentW), [contentW]);
  const investigateLabel = getSpyglassInvestigateLabel();

  useTick(() => {
    if (ringRef.current) {
      drawSpyglassRing(ringRef.current, viewRadius);
    }
  });

  return (
    <pixiContainer sortableChildren eventMode="passive">
      <pixiText
        text="Scout's Spyglass"
        style={titleStyle}
        anchor={{ x: 0.5, y: 0 }}
        x={layout.contentCX}
        y={layout.titleY}
        eventMode="none"
      />

      <pixiText
        text="View from the spyglass — details stay hidden until you commit."
        style={hintStyle}
        anchor={{ x: 0.5, y: 0 }}
        x={layout.contentCX}
        y={layout.hintY}
        eventMode="none"
      />

      <SpyglassCircleImage
        eventId={eventId}
        centerX={layout.contentCX}
        centerY={layout.circleCenterY}
        diameter={viewRadius * 2}
      />

      <pixiGraphics
        ref={ringRef}
        x={layout.contentCX}
        y={layout.circleCenterY}
        eventMode="none"
        draw={() => {}}
      />

      <Button
        variant="neutral"
        label="Avoid"
        x={layout.contentCX}
        y={layout.avoidButtonY}
        width={layout.buttonWidth}
        height={layout.buttonHeight}
        onClick={avoidTrailEventWithSpyglass}
      />

      <Button
        variant="primary"
        label={investigateLabel}
        x={layout.contentCX}
        y={layout.investigateButtonY}
        width={layout.buttonWidth}
        height={layout.buttonHeight}
        onClick={investigateTrailEventWithSpyglass}
      />
    </pixiContainer>
  );
}
