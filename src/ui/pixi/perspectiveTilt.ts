import type { PerspectiveMesh } from 'pixi.js';

export type PerspectiveTiltConfig = {
  /** Divisor for pointer offset → degrees (lower = stronger tilt). */
  sensitivity?: number;
  /** Perspective distance for 3D projection (higher = subtler depth). */
  perspective?: number;
  /** Max tilt in degrees per axis. */
  maxDegrees?: number;
};

/** Maps tilt corners from logical size (e.g. on-screen card) into mesh/texture space. */
export type PerspectiveCornerSpace = {
  scaleX: number;
  scaleY: number;
};

const DEFAULT_CONFIG: Required<PerspectiveTiltConfig> = {
  sensitivity: 10,
  perspective: 300,
  maxDegrees: 8,
};

type Point2 = { x: number; y: number };

export type PerspectiveCorners = {
  points: Point2[];
  outPoints: Point2[];
};

/** Unit-square corners (top-left → clockwise). */
export function createUnitCorners(): PerspectiveCorners {
  return createInsetUnitCorners(0);
}

/**
 * Inset unit-square corners to keep perspective skew from sampling
 * adjacent sprites in a tightly packed atlas.
 */
export function createInsetUnitCorners(inset: number): PerspectiveCorners {
  const i = clamp(inset, 0, 0.49);
  const points = [
    { x: i, y: i },
    { x: 1 - i, y: i },
    { x: 1 - i, y: 1 - i },
    { x: i, y: 1 - i },
  ];
  return { points, outPoints: points.map((p) => ({ ...p })) };
}

export function pointerToTiltAngles(
  localX: number,
  localY: number,
  config: PerspectiveTiltConfig = {},
): { angleX: number; angleY: number } {
  const { sensitivity, maxDegrees } = { ...DEFAULT_CONFIG, ...config };
  const angleY = clamp(-localX / sensitivity, -maxDegrees, maxDegrees);
  const angleX = clamp(-localY / sensitivity, -maxDegrees, maxDegrees);
  return { angleX, angleY };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rotate3D(
  points: Point2[],
  outPoints: Point2[],
  angleX: number,
  angleY: number,
  width: number,
  height: number,
  perspective: number,
): void {
  const radX = (angleX * Math.PI) / 180;
  const radY = (angleY * Math.PI) / 180;
  const cosX = Math.cos(radX);
  const sinX = Math.sin(radX);
  const cosY = Math.cos(radY);
  const sinY = Math.sin(radY);
  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < points.length; i++) {
    const src = points[i]!;
    const out = outPoints[i]!;
    const x = src.x * width - centerX;
    const y = src.y * height - centerY;
    let z = 0;

    const xY = cosY * x - sinY * z;
    z = sinY * x + cosY * z;

    const yX = cosX * y - sinX * z;
    z = sinX * y + cosX * z;

    const scale = perspective / (perspective - z);

    out.x = xY * scale + centerX;
    out.y = yX * scale + centerY;
  }
}

export function applyTiltToMesh(
  mesh: PerspectiveMesh | null,
  corners: PerspectiveCorners,
  angleX: number,
  angleY: number,
  width: number,
  height: number,
  config: PerspectiveTiltConfig = {},
  cornerSpace?: PerspectiveCornerSpace,
): void {
  if (!mesh) {
    return;
  }

  const { perspective } = { ...DEFAULT_CONFIG, ...config };
  rotate3D(corners.points, corners.outPoints, angleX, angleY, width, height, perspective);

  const scaleX = cornerSpace?.scaleX ?? 1;
  const scaleY = cornerSpace?.scaleY ?? 1;
  const [tl, tr, br, bl] = corners.outPoints;
  mesh.setCorners(
    tl!.x * scaleX,
    tl!.y * scaleY,
    tr!.x * scaleX,
    tr!.y * scaleY,
    br!.x * scaleX,
    br!.y * scaleY,
    bl!.x * scaleX,
    bl!.y * scaleY,
  );
}

export function resetMeshCorners(
  mesh: PerspectiveMesh | null,
  corners: PerspectiveCorners,
  width: number,
  height: number,
  cornerSpace?: PerspectiveCornerSpace,
): void {
  applyTiltToMesh(mesh, corners, 0, 0, width, height, {}, cornerSpace);
}
