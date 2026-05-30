import type { AuraFrameContext, AuraHostKind } from "@/ui/effects/types";

export const DEFAULT_AURA_PADDING = 18;

/** Re-export — see dieTuning.ts */
export { CARD_AURA_PADDING, DIE_AURA_PADDING } from "@/ui/effects/dieTuning";

export function createDefaultAuraFrame(
  hostKind: AuraHostKind,
  width: number,
  height: number,
  phase = 0,
): AuraFrameContext {
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
