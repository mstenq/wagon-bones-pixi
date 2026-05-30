import { BlurFilter, Graphics } from "pixi.js";

import { addGlowLayer, makeRuntime, noopDestroy, pulse01 } from "@/ui/effects/effectHelpers";
import { borderBoundsFromSize } from "@/ui/effects/shared/borderFrame";
import { orbitPosition } from "@/ui/effects/shared/orbit";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

const RUNE_CHARS = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ"];

export const arcaneEffect: EffectDefinition = {
  id: "arcane",
  label: "Arcane",
  create(layers, mount) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const glyph = addGlowLayer(layers.back, 0);
    glyph.filters = [new BlurFilter({ strength: 4, quality: 3 })];
    const energy = addGlowLayer(layers.front, 1);
    const runeOrbs = Array.from({ length: RUNE_CHARS.length }, () => addGlowLayer(layers.front, 0));

    const step = (frame: EffectFrameContext) => {
      const t = frame.time;
      const pulse = frame.activated ? pulse01(t, 0.6) : pulse01(t, 2.5) * 0.5;

      glyph.clear();
      glyph.rotation = t * 0.25;
      glyph.circle(0, 0, Math.min(bounds.halfW, bounds.halfH) * 0.75);
      glyph.stroke({ width: 2, color: 0x6644cc, alpha: 0.35 + pulse * 0.3 });
      glyph.moveTo(-20, 0);
      glyph.lineTo(20, 0);
      glyph.moveTo(0, -20);
      glyph.lineTo(0, 20);
      glyph.stroke({ width: 1, color: 0x8866ff, alpha: 0.4 });

      runeOrbs.forEach((g, i) => {
        const pos = orbitPosition(t, bounds.halfW * 1.05, bounds.halfH * 0.95, 0.35, i * 0.9);
        g.clear();
        g.position.set(pos.x, pos.y);
        g.rotation = -t * 0.35 + i;
        g.circle(0, 0, 8);
        g.fill({ color: 0x5533aa, alpha: 0.5 });
      });

      energy.clear();
      energy.roundRect(-bounds.halfW, -bounds.halfH, bounds.halfW * 2, bounds.halfH * 2, 8);
      energy.stroke({ width: 2, color: 0x7744ff, alpha: 0.25 + pulse * 0.35 });
    };

    return makeRuntime("arcane", step, noopDestroy(() => {
      glyph.destroy();
      energy.destroy();
      runeOrbs.forEach((g) => g.destroy());
    }));
  },
};
