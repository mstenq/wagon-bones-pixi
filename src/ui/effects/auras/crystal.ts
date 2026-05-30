import { BlurFilter, ColorMatrixFilter, Graphics } from "pixi.js";

import { getEffectTexture } from "@/assets/effects/textures";
import { addGlowLayer, addSpriteLayer, applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/auraHelpers";
import { borderBoundsFromSize } from "@/ui/effects/shared/borderFrame";
import { orbitPosition } from "@/ui/effects/shared/orbit";
import type { AuraDefinition, AuraFrameContext } from "@/ui/effects/types";

export const crystalAura: AuraDefinition = {
  id: "crystal",
  label: "Crystal",
  create(layers, mount, art) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const glow = addGlowLayer(layers.back, 0);
    glow.filters = [new BlurFilter({ strength: 12, quality: 4 })];
    const shards: Graphics[] = [];
    const sparkleTex = getEffectTexture("sparkle");
    const sparkles = Array.from({ length: 6 }, (_, i) =>
      addSpriteLayer(layers.front, sparkleTex, 10 + i),
    );
    for (let i = 0; i < 6; i++) {
      const g = addGlowLayer(layers.front, i);
      shards.push(g);
    }
    const contrast = new ColorMatrixFilter();
    applyArtFilters(art, [contrast]);

    const step = (frame: AuraFrameContext) => {
      const t = frame.time;
      const pulse = (Math.sin(t * 2) + 1) * 0.5;
      contrast.contrast(0.1 + pulse * 0.08, false);

      glow.clear();
      glow.roundRect(-bounds.halfW, -bounds.halfH, bounds.halfW * 2, bounds.halfH * 2, 8);
      glow.fill({ color: 0x6644cc, alpha: 0.08 });
      glow.fill({ color: 0x44aacc, alpha: 0.06 });

      shards.forEach((g, i) => {
        const pos = orbitPosition(t, bounds.halfW * 1.05, bounds.halfH * 0.95, 0.45 + i * 0.07, i * 1.2);
        g.clear();
        g.position.set(pos.x, pos.y);
        g.rotation = t * 0.5 + i;
        g.poly([0, -12, 8, 8, -8, 8]);
        g.fill({ color: i % 2 ? 0xaa66ff : 0x66ddff, alpha: 0.55 });
        g.stroke({ width: 1, color: 0xffffff, alpha: 0.4 });
      });

      sparkles.forEach((s, i) => {
        if (!s) return;
        const pos = orbitPosition(t * 1.2, bounds.halfW * 0.7, bounds.halfH * 0.6, 0.8, i);
        s.position.set(pos.x, pos.y);
        s.alpha = 0.3 + pulse * 0.5;
        s.scale.set(0.4);
      });
    };

    return makeRuntime("crystal", step, noopDestroy(() => applyArtFilters(art, null), () => {
      glow.destroy();
      shards.forEach((g) => g.destroy());
      sparkles.forEach((s) => s?.destroy());
    }));
  },
};
