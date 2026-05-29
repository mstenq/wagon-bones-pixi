import type { PerspectiveMesh } from "pixi.js";

export type PerspectiveTiltConfig = {
  /** Divisor for pointer offset → degrees (lower = stronger tilt). */
  sensitivity?: number;
  /** Perspective distance for 3D projection (higher = subtler depth). */
  perspective?: number;
  /** Max tilt in degrees per axis. */
  maxDegrees?: number;
};

const DEFAULT_CONFIG: Required<PerspectiveTiltConfig> = {
  sensitivity: 35,
  perspective: 300,
  maxDegrees: 10,
};

type Point2 = { x: number; y: number };

export type PerspectiveCorners = {
  points: Point2[];
  outPoints: Point2[];
};

/** Unit-square corners (top-left → clockwise). */
export function createUnitCorners(): PerspectiveCorners {
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
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
): void {
  if (!mesh) {
    return;
  }

  const { perspective } = { ...DEFAULT_CONFIG, ...config };
  rotate3D(corners.points, corners.outPoints, angleX, angleY, width, height, perspective);

  const [tl, tr, br, bl] = corners.outPoints;
  mesh.setCorners(tl!.x, tl!.y, tr!.x, tr!.y, br!.x, br!.y, bl!.x, bl!.y);
}

export function resetMeshCorners(
  mesh: PerspectiveMesh | null,
  corners: PerspectiveCorners,
  width: number,
  height: number,
): void {
  applyTiltToMesh(mesh, corners, 0, 0, width, height);
}
