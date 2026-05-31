/** Matches CSS `score-box-char-idle` duration in index.css. */
export const WAVE_IDLE_PERIOD_S = 2.7;

/** Per-character phase offset; default for WaveBounceChars and WaveBouncePixi. */
export const WAVE_IDLE_STAGGER_S = 0.1;

/** Peak translate in `score-box-char-idle` keyframes (em). */
export const WAVE_IDLE_PEAK_EM = 0.065;

export const WAVE_CLICK_RIPPLE_MS = 420;
export const WAVE_CLICK_BUMP_PX = 6;

const WAVE_IDLE_OMEGA = (Math.PI * 2) / WAVE_IDLE_PERIOD_S;

export function waveIdleAmplitudePx(fontSizePx: number): number {
  return fontSizePx * WAVE_IDLE_PEAK_EM;
}

/** Vertical offset for idle wave; matches CSS score-box-char-idle shape (sin peak). */
export function waveIdleOffsetY(
  timeSeconds: number,
  charIndex: number,
  staggerSeconds: number,
  amplitudePx: number,
): number {
  const phase = timeSeconds * WAVE_IDLE_OMEGA + charIndex * staggerSeconds * WAVE_IDLE_OMEGA;
  return Math.sin(phase) * amplitudePx;
}

/** Click ripple bump along label X from normalized click 0–1. */
export function waveClickBumpY(
  elapsedMs: number,
  charIndex: number,
  charCount: number,
  clickNormX: number,
  maxBumpPx: number,
  durationMs: number,
): number {
  if (charCount <= 0 || durationMs <= 0) {
    return 0;
  }
  const t = Math.min(1, Math.max(0, elapsedMs / durationMs));
  const charNorm = charCount === 1 ? 0.5 : charIndex / (charCount - 1);
  const dist = Math.abs(charNorm - clickNormX);
  const wave = Math.exp(-dist * 4.2) * Math.sin(t * Math.PI);
  return -wave * maxBumpPx;
}
