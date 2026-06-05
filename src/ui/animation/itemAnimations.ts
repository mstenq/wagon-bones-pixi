import { Color, Container, Text, TextStyle, type ColorSource, type Texture } from 'pixi.js';

import {
  burnDestroyDissolveAt,
  createBurnDissolveFilter,
  BURN_DESTROY,
  type BurnDissolveFilter,
} from '@/ui/actionEffects/burnDissolveFilter';
import type { ActionEffectComplete } from '@/ui/actionEffects/types';
import type { SquishTargets } from '@/ui/interaction/spring';

export type ItemShakeConfig = {
  amount?: number;
  duration?: number;
};

export type ItemTextEffectConfig = {
  text: string;
  color: ColorSource;
  shake?: ItemShakeConfig;
  /** Total on-screen time in seconds (whip-in, hold, fade). Omit for the default quick timing. */
  duration?: number;
};

export type ItemAnimationConfig =
  | { type: 'appear' }
  | { type: 'destroy' }
  | { type: 'shake'; shake?: ItemShakeConfig }
  | { type: 'textEffect'; textEffect: ItemTextEffectConfig };

const SHAKE_DEFAULT_AMOUNT = 3;
const SHAKE_FREQ = 48;
const TEXT_EFFECT_DEFAULT_DURATION = 0.25;
const TEXT_EFFECT_FADE_OUT_DURATION = 0.18;
/** End-of-round money tally — same whip-in, longer hold. */
const TEXT_EFFECT_MONEY_PAYOUT_DURATION = 0.6;
/** Per-character whip-in plays within this window. */
const TEXT_WHIP_PLAY_DURATION = 0.15;
const TEXT_WHIP_STAGGER_SPAN = TEXT_WHIP_PLAY_DURATION * 0.6;
const TEXT_WHIP_CHAR_DURATION = TEXT_WHIP_PLAY_DURATION * 0.52;
const TEXT_EFFECT_GAP = 32;
const TEXT_EFFECT_FONT_SIZE = 42;

/** Shared grow-to-peak-then-settle curve (appear + shake). */
const GROW_POP_PEAK_SCALE = 1.2;
const GROW_POP_PEAK_AT = 0.38;
const APPEAR_DURATION = 0.32;
const SHAKE_DURATION = 0.15;

type GrowPopTiming = {
  peakScale: number;
  peakAt: number;
  duration: number;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function easeOutQuad(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) * (1 - x);
}

function easeInCubic(t: number): number {
  const x = clamp01(t);
  return x * x * x;
}

/** `startScale` 0 for appear pop-in, 1 for shake on an existing item. */
function computeGrowPopScale(normalizedTime: number, timing: GrowPopTiming, startScale: number): number {
  const u = clamp01(normalizedTime);
  if (u >= 1) {
    return 1;
  }
  if (u <= timing.peakAt) {
    const p = easeOutQuad(u / timing.peakAt);
    return lerp(startScale, timing.peakScale, p);
  }
  const p = easeInCubic((u - timing.peakAt) / (1 - timing.peakAt));
  return lerp(timing.peakScale, 1, p);
}

const floatTextStyleBase = new TextStyle({
  fontFamily: '"Jersey 10", sans-serif',
  fontSize: TEXT_EFFECT_FONT_SIZE,
  fontWeight: '700',
  align: 'left',
});

type WhipTextChar = {
  node: Text;
  layoutX: number;
};

type FloatTextRow = {
  row: Container;
  chars: WhipTextChar[];
};

const charWidthCache = new Map<string, number>();

type DestroyAnimState = {
  kind: 'destroy';
  progress: number;
  duration: number;
  onComplete?: ActionEffectComplete;
};

type AppearAnimState = {
  kind: 'appear';
  elapsed: number;
  duration: number;
  onComplete?: ActionEffectComplete;
};

type ShakeAnimState = {
  kind: 'shake';
  elapsed: number;
  duration: number;
  amount: number;
  onComplete?: ActionEffectComplete;
};

type TextEffectAnimState = {
  kind: 'textEffect';
  elapsed: number;
  duration: number;
  amount: number;
  onComplete?: ActionEffectComplete;
};

type ActiveItemAnimation = DestroyAnimState | AppearAnimState | ShakeAnimState | TextEffectAnimState;

export type ItemAnimationHostContext = {
  root: Container | null;
  squish: Container | null;
  overlay: Container | null;
  hostExtent: number;
  textPlacement: 'above' | 'below';
  beforeDestroy?: () => void;
  getBurnTexture: () => Texture | null | undefined;
  burnDissolve: BurnDissolveFilter | null;
  setBurnDissolve: (filter: BurnDissolveFilter | null) => void;
};

type GrowPopState = {
  elapsed: number;
  timing: GrowPopTiming;
  startScale: number;
};

export type ItemAnimationRuntime = {
  active: ActiveItemAnimation | null;
  floatTextRow: FloatTextRow | null;
  /** One-shot grow / squash / settle layered on item squish scale. */
  growPop: GrowPopState | null;
};

export function createItemAnimationRuntime(): ItemAnimationRuntime {
  return {
    active: null,
    floatTextRow: null,
    growPop: null,
  };
}

function resolveShakeAmount(shake?: ItemShakeConfig): number {
  return shake?.amount ?? SHAKE_DEFAULT_AMOUNT;
}

function resolveShakeDuration(shake?: ItemShakeConfig): number {
  return shake?.duration ?? SHAKE_DURATION;
}

export function isItemAnimationBusy(runtime: ItemAnimationRuntime): boolean {
  return runtime.active !== null;
}

export function shouldBlockItemPointer(runtime: ItemAnimationRuntime): boolean {
  const kind = runtime.active?.kind;
  return kind === 'destroy' || kind === 'appear';
}

function getGrowPopScale(runtime: ItemAnimationRuntime): number {
  const body = runtime.growPop;
  if (!body) {
    return 1;
  }
  const u = body.elapsed / body.timing.duration;
  return computeGrowPopScale(u, body.timing, body.startScale);
}

export function getGrowPopSquishMultiplier(runtime: ItemAnimationRuntime): SquishTargets {
  const scale = getGrowPopScale(runtime);
  return { scaleX: scale, scaleY: scale };
}

function getActiveShakeAmount(runtime: ItemAnimationRuntime): number {
  const anim = runtime.active;
  if (!anim || anim.kind === 'destroy' || anim.kind === 'appear') {
    return 0;
  }
  return anim.amount;
}

function getActiveShakeTiming(runtime: ItemAnimationRuntime): { elapsed: number; duration: number } | null {
  const anim = runtime.active;
  if (!anim || anim.kind === 'destroy' || anim.kind === 'appear') {
    return null;
  }
  return { elapsed: anim.elapsed, duration: anim.duration };
}

export function getShakeOffsetX(runtime: ItemAnimationRuntime): number {
  const amount = getActiveShakeAmount(runtime);
  const timing = getActiveShakeTiming(runtime);
  if (amount <= 0 || !timing) {
    return 0;
  }
  const decay = 1 - clamp01(timing.elapsed / timing.duration);
  return Math.sin(timing.elapsed * SHAKE_FREQ) * amount * decay;
}

function measureWhipCharWidth(char: string, style: TextStyle): number {
  const key = `${char}:${style.fontSize}:${style.fontFamily}`;
  const cached = charWidthCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const probe = new Text({ text: char, style });
  const width = probe.width;
  probe.destroy();
  charWidthCache.set(key, width);
  return width;
}

function createTextStyleForColor(color: ColorSource): TextStyle {
  const fill = new Color(color).toNumber();
  return new TextStyle({
    fontFamily: floatTextStyleBase.fontFamily,
    fontSize: floatTextStyleBase.fontSize,
    fontWeight: floatTextStyleBase.fontWeight,
    align: floatTextStyleBase.align,
    fill,
  });
}

function createWhipTextRow(text: string, color: ColorSource): FloatTextRow {
  const style = createTextStyleForColor(color);
  const row = new Container({ eventMode: 'none' });
  const chars: WhipTextChar[] = [];
  let cursor = 0;
  const charGap = 1;

  for (const char of [...text]) {
    const node = new Text({
      text: char,
      style,
      anchor: { x: 0, y: 0.5 },
      eventMode: 'none',
    });
    node.x = cursor;
    node.visible = false;
    row.addChild(node);
    chars.push({ node, layoutX: cursor });
    cursor += measureWhipCharWidth(char, style) + charGap;
  }

  row.pivot.x = cursor / 2;
  return { row, chars };
}

function floatTextY(ctx: ItemAnimationHostContext): number {
  const half = ctx.hostExtent / 2;
  if (ctx.textPlacement === 'above') {
    return -half - TEXT_EFFECT_GAP;
  }
  return half + TEXT_EFFECT_GAP;
}

function attachFloatTextRow(ctx: ItemAnimationHostContext, floatRow: FloatTextRow): boolean {
  const overlay = ctx.overlay;
  if (!overlay || floatRow.row.destroyed) {
    return false;
  }
  if (floatRow.row.parent !== overlay) {
    if (floatRow.row.parent) {
      floatRow.row.parent.removeChild(floatRow.row);
    }
    overlay.addChild(floatRow.row);
  }
  floatRow.row.x = 0;
  floatRow.row.y = floatTextY(ctx);
  floatRow.row.alpha = 1;
  return true;
}

function removeFloatTextRow(floatRow: FloatTextRow | null): void {
  if (!floatRow) {
    return;
  }
  floatRow.row.destroy({ children: true });
}

function resolveTextEffectDuration(textEffect: ItemTextEffectConfig): number {
  return textEffect.duration ?? TEXT_EFFECT_DEFAULT_DURATION;
}

function whipCharStartTime(index: number, count: number): number {
  if (count <= 1) {
    return 0;
  }
  return (index / (count - 1)) * TEXT_WHIP_STAGGER_SPAN;
}

function easeOutExpo(t: number): number {
  const x = clamp01(t);
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

type WhipCharPose = {
  scaleX: number;
  scaleY: number;
  offsetY: number;
  alpha: number;
  visible: boolean;
};

function computeWhipCharPose(charElapsed: number): WhipCharPose {
  if (charElapsed <= 0) {
    return { scaleX: 1, scaleY: 1, offsetY: 0, alpha: 0, visible: false };
  }

  const u = charElapsed / TEXT_WHIP_CHAR_DURATION;

  if (u >= 1) {
    return { scaleX: 1, scaleY: 1, offsetY: 0, alpha: 1, visible: true };
  }

  if (u < 0.42) {
    const p = easeOutExpo(u / 0.42);
    return {
      scaleX: lerp(1.75, 1.22, p),
      scaleY: lerp(0.42, 0.78, p),
      offsetY: lerp(-16, 3, p),
      alpha: Math.min(1, p * 1.35),
      visible: true,
    };
  }

  const p = smoothstep((u - 0.42) / 0.58);
  return {
    scaleX: lerp(1.22, 1, p),
    scaleY: lerp(0.78, 1, p),
    offsetY: lerp(3, 0, p),
    alpha: 1,
    visible: true,
  };
}

function stepWhipTextRow(floatRow: FloatTextRow, elapsed: number, totalDuration: number): void {
  const count = floatRow.chars.length;
  for (let index = 0; index < count; index += 1) {
    const { node } = floatRow.chars[index]!;
    const charElapsed = elapsed - whipCharStartTime(index, count);
    const pose = computeWhipCharPose(charElapsed);
    node.visible = pose.visible;
    node.alpha = pose.alpha;
    node.scale.set(pose.scaleX, pose.scaleY);
    node.y = pose.offsetY;
  }

  const fadeStart = totalDuration - TEXT_EFFECT_FADE_OUT_DURATION;
  if (elapsed > fadeStart) {
    floatRow.row.alpha = 1 - smoothstep((elapsed - fadeStart) / TEXT_EFFECT_FADE_OUT_DURATION) * 0.92;
  } else {
    floatRow.row.alpha = 1;
  }
}

function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function startGrowPop(runtime: ItemAnimationRuntime, duration: number, startScale: number): void {
  runtime.growPop = {
    elapsed: 0,
    timing: {
      peakScale: GROW_POP_PEAK_SCALE,
      peakAt: GROW_POP_PEAK_AT,
      duration,
    },
    startScale,
  };
}

function isGrowPopSettled(runtime: ItemAnimationRuntime): boolean {
  const body = runtime.growPop;
  if (!body) {
    return true;
  }
  return body.elapsed >= body.timing.duration;
}

function stepGrowPop(runtime: ItemAnimationRuntime, dt: number): void {
  const body = runtime.growPop;
  if (!body) {
    return;
  }
  body.elapsed = Math.min(body.timing.duration, body.elapsed + dt);
}

function clearGrowPop(runtime: ItemAnimationRuntime): void {
  runtime.growPop = null;
}

export function startItemAnimation(
  runtime: ItemAnimationRuntime,
  ctx: ItemAnimationHostContext,
  config: ItemAnimationConfig,
  onComplete?: ActionEffectComplete,
): boolean {
  if (isItemAnimationBusy(runtime)) {
    return false;
  }

  if (config.type === 'appear') {
    startGrowPop(runtime, APPEAR_DURATION, 0);
    runtime.active = {
      kind: 'appear',
      elapsed: 0,
      duration: APPEAR_DURATION,
      onComplete,
    };
    return true;
  }

  if (config.type === 'destroy') {
    const burnTex = ctx.getBurnTexture();
    if (!burnTex) {
      if (ctx.root) {
        ctx.root.visible = false;
      }
      onComplete?.();
      return true;
    }

    ctx.beforeDestroy?.();

    let burn = ctx.burnDissolve;
    if (!burn) {
      burn = createBurnDissolveFilter(burnTex);
      ctx.setBurnDissolve(burn);
    }

    burn.setDissolve(0);
    if (ctx.squish) {
      ctx.squish.filters = [burn.filter];
    }

    runtime.active = {
      kind: 'destroy',
      progress: 0,
      duration: BURN_DESTROY.duration,
      onComplete,
    };
    return true;
  }

  if (config.type === 'shake') {
    const duration = resolveShakeDuration(config.shake);
    startGrowPop(runtime, duration, 1);
    runtime.active = {
      kind: 'shake',
      elapsed: 0,
      duration,
      amount: resolveShakeAmount(config.shake),
      onComplete,
    };
    return true;
  }

  const { textEffect } = config;
  removeFloatTextRow(runtime.floatTextRow);
  runtime.floatTextRow = null;
  const floatRow = createWhipTextRow(textEffect.text, textEffect.color);
  runtime.floatTextRow = floatRow;
  attachFloatTextRow(ctx, floatRow);

  const shakeAmount = textEffect.shake ? resolveShakeAmount(textEffect.shake) : 0;

  if (shakeAmount > 0) {
    startGrowPop(runtime, resolveShakeDuration(textEffect.shake), 1);
  }

  const duration = resolveTextEffectDuration(textEffect);
  runtime.active = {
    kind: 'textEffect',
    elapsed: 0,
    duration,
    amount: shakeAmount,
    onComplete,
  };
  return true;
}

export type ItemAnimationStepResult = {
  destroyBlocksTick: boolean;
};

function finishItemAnimation(runtime: ItemAnimationRuntime, anim: ActiveItemAnimation): void {
  if (anim.kind === 'textEffect') {
    removeFloatTextRow(runtime.floatTextRow);
    runtime.floatTextRow = null;
  }
  clearGrowPop(runtime);
  const onComplete = anim.onComplete;
  runtime.active = null;
  onComplete?.();
}

function isTimedAnimationDone(
  runtime: ItemAnimationRuntime,
  anim: AppearAnimState | ShakeAnimState | TextEffectAnimState,
): boolean {
  return isGrowPopSettled(runtime) || anim.elapsed >= anim.duration;
}

export function stepItemAnimation(
  runtime: ItemAnimationRuntime,
  ctx: ItemAnimationHostContext,
  dt: number,
): ItemAnimationStepResult {
  const anim = runtime.active;
  if (!anim) {
    return { destroyBlocksTick: false };
  }

  if (anim.kind === 'destroy') {
    anim.progress += dt / anim.duration;
    const linear = Math.min(1, anim.progress);
    ctx.burnDissolve?.setDissolve(burnDestroyDissolveAt(linear));

    if (linear >= 1) {
      if (ctx.root) {
        ctx.root.visible = false;
      }
      if (ctx.squish) {
        ctx.squish.filters = null;
      }
      finishItemAnimation(runtime, anim);
      return { destroyBlocksTick: true };
    }

    return { destroyBlocksTick: true };
  }

  anim.elapsed += dt;

  if (runtime.growPop) {
    stepGrowPop(runtime, dt);
  }

  if (anim.kind === 'textEffect') {
    const floatRow = runtime.floatTextRow;
    if (floatRow && !floatRow.row.destroyed) {
      if (!floatRow.row.parent) {
        attachFloatTextRow(ctx, floatRow);
      }
      if (floatRow.row.parent) {
        stepWhipTextRow(floatRow, anim.elapsed, anim.duration);
      }
    }

    if (anim.elapsed >= anim.duration) {
      finishItemAnimation(runtime, anim);
    }

    return { destroyBlocksTick: false };
  }

  if (anim.kind === 'appear' || anim.kind === 'shake') {
    if (isTimedAnimationDone(runtime, anim)) {
      finishItemAnimation(runtime, anim);
    }
  }

  return { destroyBlocksTick: false };
}

export const itemTextAnim = {
  retrigger: (): ItemAnimationConfig => ({
    type: 'textEffect',
    textEffect: { text: 'Again!', color: '#a855f7', shake: { amount: 5 } },
  }),
  mult: (n: number): ItemAnimationConfig => ({
    type: 'textEffect',
    textEffect: { text: `+${n} mult`, color: '#ef4444', shake: { amount: 2 } },
  }),
  mile: (n: number): ItemAnimationConfig => ({
    type: 'textEffect',
    textEffect: { text: `+${n} miles`, color: '#60a5fa', shake: { amount: 2 } },
  }),
  money: (n: number): ItemAnimationConfig => ({
    type: 'textEffect',
    textEffect: {
      text: `+$${n}`,
      color: '#facc15',
      duration: TEXT_EFFECT_MONEY_PAYOUT_DURATION,
      shake: { amount: 1 },
    },
  }),
  moneyTrigger: (n: number): ItemAnimationConfig => ({
    type: 'textEffect',
    textEffect: { text: `+$${n}`, color: '#facc15', shake: { amount: 1 } },
  }),
};

export function itemShakeAnim(shake?: ItemShakeConfig): ItemAnimationConfig {
  return { type: 'shake', shake };
}
