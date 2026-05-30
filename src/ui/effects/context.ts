import type { EffectFrameContext, EffectHostKind } from "@/ui/effects/types";

export const DEFAULT_EFFECT_PADDING = 18;

/** Re-export — see dieTuning.ts */
export { CARD_EFFECT_PADDING, DIE_EFFECT_PADDING } from "@/ui/effects/dieTuning";

export function createDefaultEffectFrame(
  hostKind: EffectHostKind,
  width: number,
  height: number,
  phase = 0,
): EffectFrameContext {
  return {
    dt: 0,
    time: 0,
    width,
    height,
    hostKind,
    hovered: false,
    dragging: false,
    activated: false,
    tiltX: 0,
    tiltY: 0,
    pointerNormX: 0.5,
    pointerNormY: 0.5,
    phase,
  };
}
