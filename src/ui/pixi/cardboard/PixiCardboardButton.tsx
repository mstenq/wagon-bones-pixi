import { Rectangle, type Container, type FederatedPointerEvent } from "pixi.js";
import { use, useCallback, useMemo } from "react";

import type { CardboardButtonVariant } from "@/ui/cardboard/assets";
import {
  CARDBOARD_BUTTON_DEFAULT_HEIGHT,
  CARDBOARD_BUTTON_DEFAULT_WIDTH,
} from "@/ui/cardboard/buttonTheme";
import { CARDBOARD_BUTTON_SOURCE_SLICE_PX } from "@/ui/cardboard/theme";
import { cardboardButtonLabelStyle } from "@/ui/pixi/cardboard/buttonLabelStyle";
import { PixiCardboardNinePatch } from "@/ui/pixi/cardboard/PixiCardboardNinePatch";
import {
  cardboardButtonTexturesReady,
  getCardboardButtonTexture,
} from "@/ui/pixi/cardboard/textures";

export type PixiCardboardButtonProps = {
  variant: CardboardButtonVariant;
  label: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  disabled?: boolean;
  onClick?: () => void;
};

export function PixiCardboardButton({
  variant,
  label,
  x = 0,
  y = 0,
  width = CARDBOARD_BUTTON_DEFAULT_WIDTH,
  height = CARDBOARD_BUTTON_DEFAULT_HEIGHT,
  disabled = false,
  onClick,
}: PixiCardboardButtonProps) {
  use(cardboardButtonTexturesReady);

  const labelStyle = useMemo(() => cardboardButtonLabelStyle(disabled), [disabled]);

  const hitArea = useMemo(
    () => new Rectangle(0, 0, width, height),
    [height, width],
  );

  const bindRoot = useCallback(
    (node: Container | null) => {
      if (!node) {
        return;
      }
      node.hitArea = hitArea;
      node.eventMode = disabled ? "none" : "static";
      node.cursor = disabled ? "default" : "pointer";
    },
    [disabled, hitArea],
  );

  const onPointerTap = useCallback(
    (event: FederatedPointerEvent) => {
      if (disabled) {
        return;
      }
      event.stopPropagation();
      onClick?.();
    },
    [disabled, onClick],
  );

  return (
    <pixiContainer
      ref={bindRoot}
      x={x}
      y={y}
      alpha={disabled ? 0.55 : 1}
      sortableChildren
      onPointerTap={disabled ? undefined : onPointerTap}
    >
      <PixiCardboardNinePatch
        key={variant}
        width={width}
        height={height}
        border={CARDBOARD_BUTTON_SOURCE_SLICE_PX}
        texture={getCardboardButtonTexture(variant)}
      />
      <pixiText
        text={label}
        x={width / 2}
        y={height / 2}
        anchor={0.5}
        style={labelStyle}
        eventMode="none"
        zIndex={1}
      />
    </pixiContainer>
  );
}
