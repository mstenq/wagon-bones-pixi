import type { EffectFrameContext } from '@/ui/effects/types';

export type SurfacePoint = { x: number; y: number };

export function projectPointToSurface(point: SurfacePoint, frame: EffectFrameContext): SurfacePoint {
  const u = point.x / frame.width + 0.5;
  const v = point.y / frame.height + 0.5;
  const invU = 1 - u;
  const invV = 1 - v;
  const [tl, tr, br, bl] = frame.surfaceCorners;
  return {
    x: tl.x * invU * invV + tr.x * u * invV + br.x * u * v + bl.x * invU * v,
    y: tl.y * invU * invV + tr.y * u * invV + br.y * u * v + bl.y * invU * v,
  };
}
