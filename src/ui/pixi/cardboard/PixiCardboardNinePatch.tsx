import type { Container, Texture } from "pixi.js";
import { use, useCallback } from "react";

import { CARDBOARD_CONTAINER_SOURCE_SLICE_PX } from "@/ui/cardboard/theme";
import {
  applyWavyPanelMask,
  createCardboardBackground,
} from "@/ui/pixi/cardboard/createCardboardBackground";
import {
  cardboardTileTexturesReady,
  getCardboardTileTexture,
} from "@/ui/pixi/cardboard/textures";

export type PixiCardboardNinePatchProps = {
  width: number;
  height: number;
  /** Source PNG inset used for corner/edge sampling (px). */
  border?: number;
  texture?: Texture;
};

/** Imperative tiled cardboard frame for Pixi (mount/unmount via ref). */
export function PixiCardboardNinePatch({
  width,
  height,
  border = CARDBOARD_CONTAINER_SOURCE_SLICE_PX,
  texture,
}: PixiCardboardNinePatchProps) {
  use(cardboardTileTexturesReady);

  const mountBackground = useCallback(
    (node: Container | null) => {
      if (!node) {
        return;
      }
      const base = texture ?? getCardboardTileTexture();
      node.removeChildren();
      node.addChild(createCardboardBackground(base, width, height, border));
    },
    [border, height, texture, width],
  );

  return <pixiContainer ref={mountBackground} eventMode="none" zIndex={0} />;
}

export type PixiCardboardPanelFrameProps = PixiCardboardNinePatchProps & {
  wavyEdges?: boolean;
};

/** Nine-patch with optional wavy top/bottom mask (game panels only). */
export function PixiCardboardPanelFrame({
  width,
  height,
  border = CARDBOARD_CONTAINER_SOURCE_SLICE_PX,
  texture,
  wavyEdges = false,
}: PixiCardboardPanelFrameProps) {
  use(cardboardTileTexturesReady);

  const mountBackground = useCallback(
    (node: Container | null) => {
      if (!node) {
        return;
      }
      const base = texture ?? getCardboardTileTexture();
      node.removeChildren();
      const panel = createCardboardBackground(base, width, height, border);
      if (wavyEdges) {
        applyWavyPanelMask(panel, width, height);
      }
      node.addChild(panel);
    },
    [border, height, texture, wavyEdges, width],
  );

  return <pixiContainer ref={mountBackground} eventMode="none" zIndex={0} />;
}
