export function orbitPosition(
  time: number,
  radiusX: number,
  radiusY: number,
  speed: number,
  phase = 0,
): { x: number; y: number } {
  const a = time * speed + phase;
  return {
    x: Math.cos(a) * radiusX,
    y: Math.sin(a) * radiusY,
  };
}
