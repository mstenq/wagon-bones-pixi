import { Rectangle, Texture } from "pixi.js";

export type TextureSize = { width: number; height: number };

export type NinePatchCornerPlacement = {
  destX: number;
  destY: number;
  srcX: number;
  srcY: number;
};

export type NinePatchLayout = {
  srcW: number;
  srcH: number;
  border: number;
  innerW: number;
  innerH: number;
  edgeW: number;
  edgeH: number;
  corners: NinePatchCornerPlacement[];
  hasCenter: boolean;
  hasHorizontalEdges: boolean;
  hasVerticalEdges: boolean;
};

export function subTexture(base: Texture, x: number, y: number, w: number, h: number): Texture {
  return new Texture({
    source: base.source,
    frame: new Rectangle(x, y, w, h),
  });
}

export function textureSourceSize(base: Texture): TextureSize {
  const { width, height } = base;
  if (width > 0 && height > 0) {
    return { width, height };
  }
  const source = base.source;
  return { width: source.width, height: source.height };
}

/** Regions for a nine-patch frame; no display objects. */
export function computeNinePatchLayout(
  base: Texture,
  width: number,
  height: number,
  border: number,
): NinePatchLayout | null {
  const { width: srcW, height: srcH } = textureSourceSize(base);
  if (srcW <= 0 || srcH <= 0) {
    return null;
  }

  const innerW = Math.max(0, width - border * 2);
  const innerH = Math.max(0, height - border * 2);
  const edgeW = Math.max(0, srcW - border * 2);
  const edgeH = Math.max(0, srcH - border * 2);

  const corners: NinePatchCornerPlacement[] = [
    { destX: 0, destY: 0, srcX: 0, srcY: 0 },
    { destX: width - border, destY: 0, srcX: srcW - border, srcY: 0 },
    { destX: 0, destY: height - border, srcX: 0, srcY: srcH - border },
    { destX: width - border, destY: height - border, srcX: srcW - border, srcY: srcH - border },
  ];

  return {
    srcW,
    srcH,
    border,
    innerW,
    innerH,
    edgeW,
    edgeH,
    corners,
    hasCenter: innerW > 0 && innerH > 0 && edgeW > 0 && edgeH > 0,
    hasHorizontalEdges: innerW > 0 && edgeW > 0,
    hasVerticalEdges: innerH > 0 && edgeH > 0,
  };
}
