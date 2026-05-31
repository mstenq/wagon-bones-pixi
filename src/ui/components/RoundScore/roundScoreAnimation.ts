const MAX_ANIMATION_STEPS = 10;
const STEP_INTERVAL_MS = 45;

export function formatRoundScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

/** Evenly spaced values from `from` to `to`, at most 10 frames (excluding duplicate ends). */
export function buildRoundScoreAnimationFrames(from: number, to: number): number[] {
  const start = formatRoundScore(from);
  const end = formatRoundScore(to);

  if (start === end) {
    return [end];
  }

  const diff = end - start;
  const stepCount = Math.min(MAX_ANIMATION_STEPS, Math.max(1, Math.abs(diff)));
  const frames: number[] = [];

  for (let step = 1; step <= stepCount; step += 1) {
    const value =
      step === stepCount ? end : Math.round(start + (diff * step) / stepCount);
    const last = frames[frames.length - 1];
    if (value !== last) {
      frames.push(value);
    }
  }

  if (frames[frames.length - 1] !== end) {
    frames.push(end);
  }

  return frames;
}

export { STEP_INTERVAL_MS };
