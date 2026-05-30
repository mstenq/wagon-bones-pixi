import type {
  AuraArtTarget,
  AuraId,
  AuraLayers,
  AuraMountContext,
  AuraRuntime,
} from "@/ui/effects/types";
import { getAuraDefinition } from "@/ui/effects/registry";

export function createAuraRuntime(
  id: AuraId,
  layers: AuraLayers,
  ctx: AuraMountContext,
  art: AuraArtTarget,
): AuraRuntime | null {
  if (id === "none") {
    return null;
  }
  const def = getAuraDefinition(id);
  if (!def) {
    return null;
  }
  return def.create(layers, ctx, art);
}

export function stepAura(runtime: AuraRuntime, frame: import("@/ui/effects/types").AuraFrameContext): void {
  runtime.step(frame);
}

export function destroyAura(runtime: AuraRuntime): void {
  runtime.destroy();
}
