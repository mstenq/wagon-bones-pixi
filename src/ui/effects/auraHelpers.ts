import { Graphics, Sprite, type Container, type Filter, type Texture } from "pixi.js";

import type {
  AuraArtTarget,
  AuraDefinition,
  AuraFrameContext,
  AuraLayers,
  AuraMountContext,
  AuraRuntime,
} from "@/ui/effects/types";
import { auraEffectRadius, isDieMount } from "@/ui/effects/dieTuning";
import { auraVisualBounds, borderBoundsFromSize, type BorderBounds } from "@/ui/effects/shared/borderFrame";

export { auraEffectRadius };

export function boundsFromCtx(ctx: AuraMountContext) {
  return auraVisualBounds(ctx);
}

/** Card art size only — backdrops must not extend past the card face. */
export function artBoundsFromMount(mount: AuraMountContext): BorderBounds {
  return borderBoundsFromSize(mount.width, mount.height);
}

export function backdropBounds(mount: AuraMountContext): BorderBounds {
  return isDieMount(mount) ? auraVisualBounds(mount) : artBoundsFromMount(mount);
}

/** Random point over the card face (not on the perimeter). */
export function randomInteriorPoint(bounds: BorderBounds, margin = 0.12): { x: number; y: number } {
  const mx = bounds.halfW * (1 - margin);
  const my = bounds.halfH * (1 - margin);
  return {
    x: (Math.random() - 0.5) * mx * 2,
    y: (Math.random() - 0.5) * my * 2,
  };
}

export function makeRuntime(
  id: AuraDefinition["id"],
  step: (frame: AuraFrameContext) => void,
  destroy: () => void,
): AuraRuntime {
  return { id, step, destroy };
}

export function addGlowLayer(parent: Container, zIndex = 0): Graphics {
  const g = new Graphics();
  g.zIndex = zIndex;
  g.eventMode = "none";
  g.blendMode = "add";
  parent.addChild(g);
  return g;
}

export function addSpriteLayer(
  parent: Container,
  texture: Texture | null,
  zIndex = 1,
  blend: "add" | "normal" | "screen" = "add",
): Sprite | null {
  if (!texture) {
    return null;
  }
  const s = new Sprite({ texture, anchor: 0.5, eventMode: "none" });
  s.zIndex = zIndex;
  s.blendMode = blend;
  parent.addChild(s);
  return s;
}

export function pulse01(time: number, period: number, phase = 0): number {
  return (Math.sin((time / period) * Math.PI * 2 + phase) + 1) * 0.5;
}

export function applyArtFilters(art: AuraArtTarget, filters: Filter[] | null): void {
  art.applyFilters(filters);
}

export function noopDestroy(...disposers: (() => void)[]): () => void {
  return () => {
    for (const d of disposers) {
      d();
    }
  };
}

export type AuraBuildContext = {
  layers: AuraLayers;
  mount: AuraMountContext;
  art: AuraArtTarget;
  bounds: BorderBounds;
  backGfx: Graphics[];
  frontGfx: Graphics[];
};

export function createAuraBuildContext(
  layers: AuraLayers,
  mount: AuraMountContext,
  art: AuraArtTarget,
): AuraBuildContext {
  return {
    layers,
    mount,
    art,
    bounds: boundsFromCtx(mount),
    backGfx: [],
    frontGfx: [],
  };
}
