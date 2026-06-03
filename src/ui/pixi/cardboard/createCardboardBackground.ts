import { Container, Sprite, TilingSprite, type Texture } from "pixi.js";

import {
  computeNinePatchLayout,
  subTexture,
  type NinePatchLayout,
} from "@/ui/pixi/cardboard/ninePatch";
import { createWavyPanelMask } from "@/ui/pixi/cardboard/wavyPanelMask";

function addNinePatchSprites(
  root: Container,
  base: Texture,
  layout: NinePatchLayout,
  width: number,
  height: number,
): void {
  const { border, innerW, innerH, edgeW, edgeH, srcH } = layout;

  if (layout.hasCenter) {
    const center = new TilingSprite({
      texture: subTexture(base, border, border, edgeW, edgeH),
      width: innerW,
      height: innerH,
    });
    center.position.set(border, border);
    root.addChild(center);
  }

  if (layout.hasHorizontalEdges) {
    const top = new TilingSprite({
      texture: subTexture(base, border, 0, edgeW, border),
      width: innerW,
      height: border,
    });
    top.position.set(border, 0);
    root.addChild(top);

    const bottom = new TilingSprite({
      texture: subTexture(base, border, srcH - border, edgeW, border),
      width: innerW,
      height: border,
    });
    bottom.position.set(border, height - border);
    root.addChild(bottom);
  }

  if (layout.hasVerticalEdges) {
    const left = new TilingSprite({
      texture: subTexture(base, 0, border, border, edgeH),
      width: border,
      height: innerH,
    });
    left.position.set(0, border);
    root.addChild(left);

    const right = new TilingSprite({
      texture: subTexture(base, layout.srcW - border, border, border, edgeH),
      width: border,
      height: innerH,
    });
    right.position.set(width - border, border);
    root.addChild(right);
  }

  for (const { destX, destY, srcX, srcY } of layout.corners) {
    const corner = new Sprite(subTexture(base, srcX, srcY, border, border));
    corner.position.set(destX, destY);
    root.addChild(corner);
  }
}

/**
 * Nine-patch cardboard frame: fixed corners, tileable edges and center.
 * Matches DOM `border-image` + repeating background behavior.
 */
export function createCardboardBackground(
  base: Texture,
  width: number,
  height: number,
  border: number,
): Container {
  const root = new Container();
  root.label = "cardboard-background";
  root.eventMode = "none";

  const layout = computeNinePatchLayout(base, width, height, border);
  if (!layout) {
    return root;
  }

  addNinePatchSprites(root, base, layout, width, height);
  return root;
}

/** Panel-only wavy outer silhouette; not used on buttons. */
export function applyWavyPanelMask(panel: Container, width: number, height: number): void {
  if (width <= 0 || height <= 0) {
    return;
  }
  const mask = createWavyPanelMask(width, height);
  panel.addChild(mask);
  panel.mask = mask;
}
