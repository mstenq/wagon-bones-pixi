export type DieOutlinePoint = { x: number; y: number };

// Normalized clockwise outline for the d20-ish die silhouette. Tweak these
// points to move die edge effects; x/y are multiplied by the die half-size.
export const DIE_EDGE_POINTS: DieOutlinePoint[] = [
  { x: 0.0, y: -1.0 }, // noon
  { x: 0.6, y: -0.8 }, // 2pm
  { x: 0.95, y: -0.2 }, // 3pm
  { x: 1, y: 0.12 }, // 4pm
  { x: .6, y: 0.8 }, // 5pm
  { x: 0.0, y: 1.0 }, // 6pm
  { x: -0.6, y: 0.8 }, // 7pm
  { x: -0.95, y: 0.25 }, // 8pm
  { x: -0.95, y: -0.12 }, // 9pm
  { x: -0.60, y: -0.78 }, // 11pm
];

export function createDieEdgeLoop(
  halfW: number,
  halfH: number,
  samples: number,
  insetScale = 1,
): DieOutlinePoint[] {
  const points: DieOutlinePoint[] = [];
  const vertices = DIE_EDGE_POINTS.map((p) => ({
    x: p.x * halfW * insetScale,
    y: p.y * halfH * insetScale,
  }));
  const lengths = vertices.map((p, i) => {
    const next = vertices[(i + 1) % vertices.length]!;
    return Math.hypot(next.x - p.x, next.y - p.y);
  });
  const perimeter = lengths.reduce((sum, len) => sum + len, 0);

  for (let i = 0; i < samples; i++) {
    let d = (i / samples) * perimeter;
    for (let segment = 0; segment < vertices.length; segment++) {
      const len = lengths[segment]!;
      if (d > len) {
        d -= len;
        continue;
      }
      const a = vertices[segment]!;
      const b = vertices[(segment + 1) % vertices.length]!;
      const t = len > 0 ? d / len : 0;
      points.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      });
      break;
    }
  }

  return points;
}
