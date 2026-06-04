import { BlurFilter, Rectangle, type Graphics } from "pixi.js";

import { DIE_SELECTED_LIFT_PX } from "@/ui/components/Dice/config";

// --- Tune die ground shadow (overhead light, fixed floor Y) ---

const DIE_SHADOW_COLOR = 0x0f172a;

/** Extra Y below die bottom (`size * 0.5`). Fraction of `size`. */
const DIE_SHADOW_GROUND_OFFSET = -0.09;

const DIE_SHADOW_RADIUS_X = 0.38;
const DIE_SHADOW_RADIUS_Y = 0.1;

const DIE_SHADOW_BASE_ALPHA = 0.38;
const DIE_SHADOW_LIFT_ALPHA_FADE = 0.10;
const DIE_SHADOW_LIFT_SIZE_EXPAND = 0.30;

export const DIE_SHADOW_BLUR_BASE = 2;
const DIE_SHADOW_BLUR_LIFT_ADD = 4;
export const DIE_SHADOW_BLUR_QUALITY = 4;

const DIE_SHADOW_FILTER_PAD = 0.2;

const DIE_SHADOW_DRAG_BELOW_FADE_START_PX = 8;
const DIE_SHADOW_DRAG_BELOW_FADE_RANGE_PX = 36;

export type DieShadowDragState = {
  /** Pins shadow to row floor while die container moves (local Y offset). */
  floorOffsetY: number;
  /** Extra lift for shadow spread/blur (drag up from home). */
  extraLiftPx: number;
  /** Multiplier for shadow opacity (drag below floor fades toward 0). */
  visibility: number;
};

type DieShadowMetrics = {
  rx: number;
  ry: number;
  alpha: number;
  blur: number;
  pad: number;
};

/**
 * Shadow local pose under a rotated drag container.
 * Keeps the ellipse world-upright and centered on the die in screen space.
 */
export function dieShadowLocalPose(
  groundY: number,
  floorOffsetY: number,
  parentRotation: number,
): { x: number; y: number; rotation: number } {
  const dy = groundY + floorOffsetY;
  const sin = Math.sin(parentRotation);
  const cos = Math.cos(parentRotation);
  return {
    x: dy * sin,
    y: dy * cos,
    rotation: -parentRotation,
  };
}

function dieShadowFloorPin(floorLineY: number, containerY: number): {
  floorOffsetY: number;
  extraLiftPx: number;
  belowPx: number;
} {
  const floorOffsetY = floorLineY - containerY;
  return {
    floorOffsetY,
    extraLiftPx: Math.max(0, floorOffsetY),
    belowPx: containerY - floorLineY,
  };
}

function dieShadowDragBelowFade(belowPx: number): number {
  if (belowPx <= DIE_SHADOW_DRAG_BELOW_FADE_START_PX) {
    return 1;
  }
  const t =
    (belowPx - DIE_SHADOW_DRAG_BELOW_FADE_START_PX) / DIE_SHADOW_DRAG_BELOW_FADE_RANGE_PX;
  return Math.max(0, 1 - t);
}

/**
 * Build per-frame shadow drag state from a flat row floor Y (or idle when unpinned).
 * `layoutY` is hook layout Y without row-arc offset; arc belongs on the draggable only.
 */
export function dieShadowDragStateFromFloor(
  floorLineY: number | null,
  layoutY: number,
): DieShadowDragState {
  if (floorLineY === null) {
    return {
      floorOffsetY: 0,
      extraLiftPx: 0,
      visibility: 1,
    };
  }
  const pin = dieShadowFloorPin(floorLineY, layoutY);
  return {
    floorOffsetY: pin.floorOffsetY,
    extraLiftPx: pin.extraLiftPx,
    visibility: dieShadowDragBelowFade(pin.belowPx),
  };
}

function dieShadowMaxLiftPx(liftPx: number, selectedLiftPx = DIE_SELECTED_LIFT_PX): number {
  // Cap liftT at 1 when drag lift exceeds selected lift; avoid divide-by-zero at rest.
  return Math.max(selectedLiftPx, liftPx, 1);
}

function dieShadowLiftT(liftPx: number, selectedLiftPx: number): number {
  const maxLiftPx = dieShadowMaxLiftPx(liftPx, selectedLiftPx);
  return Math.max(0, Math.min(1, liftPx / maxLiftPx));
}

function dieShadowMetrics(size: number, liftT: number): DieShadowMetrics {
  const expand = 1 + liftT * DIE_SHADOW_LIFT_SIZE_EXPAND;
  const rx = size * DIE_SHADOW_RADIUS_X * expand;
  const ry = size * DIE_SHADOW_RADIUS_Y * expand;
  return {
    rx,
    ry,
    alpha: DIE_SHADOW_BASE_ALPHA * (1 - liftT * DIE_SHADOW_LIFT_ALPHA_FADE),
    blur: DIE_SHADOW_BLUR_BASE + liftT * DIE_SHADOW_BLUR_LIFT_ADD,
    pad: size * DIE_SHADOW_FILTER_PAD,
  };
}

function setDieShadowFilterArea(
  graphics: Graphics,
  filterArea: Rectangle,
  metrics: DieShadowMetrics,
): void {
  const { rx, ry, pad } = metrics;
  filterArea.x = -rx - pad;
  filterArea.y = -ry - pad;
  filterArea.width = (rx + pad) * 2;
  filterArea.height = (ry + pad) * 2;
  graphics.filterArea = filterArea;
}

function drawDieGroundShadow(graphics: Graphics, metrics: DieShadowMetrics): void {
  const { rx, ry, alpha } = metrics;
  graphics.clear();
  graphics.ellipse(0, 0, rx, ry);
  graphics.fill({ color: DIE_SHADOW_COLOR, alpha });
}

/** Ground-plane Y in die root space (die face is centered at origin in lift container). */
export function dieShadowGroundY(size: number): number {
  return size * 0.5 + size * DIE_SHADOW_GROUND_OFFSET;
}

/** Draw shadow, blur, and filter bounds from current lift (per-frame). */
export function syncDieGroundShadow(
  graphics: Graphics,
  blur: BlurFilter,
  filterArea: Rectangle,
  size: number,
  liftPx: number,
  selectedLiftPx = DIE_SELECTED_LIFT_PX,
): void {
  const liftT = dieShadowLiftT(liftPx, selectedLiftPx);
  const metrics = dieShadowMetrics(size, liftT);
  drawDieGroundShadow(graphics, metrics);
  blur.strength = metrics.blur;
  graphics.filters = [blur];
  setDieShadowFilterArea(graphics, filterArea, metrics);
}
