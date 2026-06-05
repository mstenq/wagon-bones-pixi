import { use, useMemo, useRef } from 'react';
import { useTick } from '@pixi/react';
import type { Graphics } from 'pixi.js';
import { Texture } from 'pixi.js';

import { loadTrailEventTexture } from '@/loaders/trailEvents/textures';
import type { TrailEventCategory, TrailEventChoice, TrailEventDef } from '@/data/trail_events';
import { Button } from '@/ui/components/Button/Button';
import {
  drawTrailEventPanelFace,
  drawTrailEventPanelShadow,
} from '@/ui/components/TrailEventPanel/trailEventPanelVisuals';
import {
  choiceButtonY,
  type TrailEventPanelLayout,
} from '@/ui/trailEvent/trailEventLayout';
import {
  trailEventCategoryColor,
  trailEventDescriptionTextStyle,
  trailEventTitleTextStyle,
} from '@/ui/trailEvent/trailEventTheme';

export type TrailEventPanelProps = {
  event: TrailEventDef;
  layout: TrailEventPanelLayout;
  choices: TrailEventChoice[];
  choicesDisabled?: boolean;
  onChoice?: (choice: TrailEventChoice) => void;
};

function TrailEventImage({
  eventId,
  centerX,
  centerY,
  maxWidth,
  maxHeight,
}: {
  eventId: string;
  centerX: number;
  centerY: number;
  maxWidth: number;
  maxHeight: number;
}) {
  const texture = use(loadTrailEventTexture(eventId));
  if (texture === Texture.EMPTY || texture.width <= 0) {
    return null;
  }

  const scale = Math.min(maxWidth / texture.width, maxHeight / texture.height, 1);
  const width = texture.width * scale;
  const height = texture.height * scale;

  return (
    <pixiSprite
      texture={texture}
      x={centerX}
      y={centerY}
      width={width}
      height={height}
      anchor={0.5}
      eventMode="none"
    />
  );
}

export function TrailEventPanel({
  event,
  layout,
  choices,
  choicesDisabled = false,
  onChoice,
}: TrailEventPanelProps) {
  const shadowRef = useRef<Graphics | null>(null);
  const faceRef = useRef<Graphics | null>(null);

  const accentColor = trailEventCategoryColor(event.category as TrailEventCategory);
  const titleStyle = useMemo(() => trailEventTitleTextStyle(), []);
  const descriptionStyle = useMemo(
    () => trailEventDescriptionTextStyle(layout.panel.width),
    [layout.panel.width],
  );

  useTick(() => {
    if (shadowRef.current) {
      drawTrailEventPanelShadow(shadowRef.current, layout.panel.width, layout.panel.height);
    }
    if (faceRef.current) {
      drawTrailEventPanelFace(faceRef.current, layout.panel.width, layout.panel.height, accentColor);
    }
  });

  return (
    <pixiContainer x={layout.panel.centerX} y={layout.panel.centerY} sortableChildren eventMode="passive">
      <pixiGraphics ref={shadowRef} zIndex={0} eventMode="none" draw={() => {}} />
      <pixiContainer zIndex={1} sortableChildren eventMode="passive">
        <pixiGraphics ref={faceRef} eventMode="none" draw={() => {}} />

        <TrailEventImage
          eventId={event.id}
          centerX={0}
          centerY={layout.imageY - layout.panel.centerY}
          maxWidth={layout.panel.width - 40}
          maxHeight={layout.imageMaxHeight}
        />

        <pixiText
          text={event.name}
          style={titleStyle}
          anchor={{ x: 0.5, y: 0 }}
          y={layout.nameY - layout.panel.centerY}
          eventMode="none"
        />

        <pixiText
          text={event.description}
          style={descriptionStyle}
          anchor={{ x: 0.5, y: 0 }}
          y={layout.descriptionY - layout.panel.centerY}
          eventMode="none"
        />

        {choices.map((choice, index) => (
          <Button
            key={choice.id}
            variant="neutral"
            label={choice.label}
            x={0}
            y={choiceButtonY(layout, index) - layout.panel.centerY}
            width={layout.choiceButtonWidth}
            height={layout.choiceButtonHeight}
            disabled={choicesDisabled}
            onClick={onChoice ? () => onChoice(choice) : undefined}
          />
        ))}
      </pixiContainer>
    </pixiContainer>
  );
}
