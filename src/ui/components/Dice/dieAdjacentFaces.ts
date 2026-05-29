import { TextStyle } from "pixi.js";

/** One of the five pentagonal faces visible around the front face (flat-top d12). */
export type AdjacentFaceLayout = {
  /** Offset from die center, as a fraction of `size`. */
  x: number;
  y: number;
  /** Radians — aligns digits with the face plane in the asset. */
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  alpha: number;
};

const NEIGHBOR_RADIUS = 0.32;
const TWO_PI_FIFTH = (2 * Math.PI) / 5;
/** First neighbor is the face above the front pentagon (flat top edge). */
const FIRST_NEIGHBOR_ANGLE = -Math.PI / 2;

/** Per-face nudges after symmetric layout (index: top → clockwise). */
const FACE_TUNING = [
  { radius: 1.06, scale: 1.08, rot: Math.PI, dx: 0, dy: -0.018 },
  { radius: 1.02, scale: 1.05, rot: 0, dx: 0.01, dy: 0 },
  { radius: 1.04, scale: 1.06, rot: 0, dx: 0.008, dy: 0.012 },
  { radius: 1.04, scale: 1.06, rot: 0, dx: -0.008, dy: 0.012 },
  { radius: 1.02, scale: 1.05, rot: 0, dx: -0.01, dy: 0 },
] as const;

/** Layouts derived from pentagon symmetry; tweak offsets if art changes. */
export const ADJACENT_FACE_LAYOUTS: AdjacentFaceLayout[] = Array.from(
  { length: 5 },
  (_, index) => {
    const angle = FIRST_NEIGHBOR_ANGLE + index * TWO_PI_FIFTH;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tune = FACE_TUNING[index]!;
    const radius = NEIGHBOR_RADIUS * tune.radius;
    const foreshorten = 0.64 + 0.12 * Math.abs(cos);
    const sideScale = (0.5 + 0.06 * Math.abs(sin)) * tune.scale;

    return {
      x: cos * radius + tune.dx,
      y: sin * radius + tune.dy,
      rotation: angle + Math.PI / 2 + tune.rot,
      scaleX: sideScale,
      scaleY: sideScale * foreshorten,
      skewX: sin * 0.18,
      alpha: 0.82 + 0.12 * (0.5 + sin * 0.5),
    };
  },
);

export const dieAdjacentTextStyle = new TextStyle({
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 30,
  fontWeight: "800",
  fill: "#ffffff",
  stroke: { color: "#1a1a2e", width: 3 },
});

/** Five distinct values from 1–12, never including `centerValue`. */
export function pickAdjacentFaceValues(centerValue: number): number[] {
  const pool: number[] = [];
  for (let face = 1; face <= 12; face++) {
    if (face !== centerValue) {
      pool.push(face);
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, 5);
}
