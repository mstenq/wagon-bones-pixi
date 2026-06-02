export type DieOutlinePoint = { x: number; y: number };

// Normalized clockwise outline for the d20-ish die silhouette. Tweak these
// points to move die edge effects; x/y are multiplied by the die half-size.
export const DIE_EDGE_POINTS: DieOutlinePoint[] = [
  { x: 0.0, y: -1.0 }, // top middle
  { x: 0.72, y: -0.73 }, // top right
  { x: 1, y: -0.05 }, // middle right
  { x: 0.80, y: 0.65 }, // bottom right
  { x: 0.05, y: 1.05 }, // bottom middle
  { x: -0.75, y: 0.75 }, // bottom left
  { x: -1, y: 0 }, // middle left
  { x: -0.70, y: -0.78 }, // top left
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
