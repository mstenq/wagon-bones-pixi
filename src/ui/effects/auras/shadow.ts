import { BlurFilter, ColorMatrixFilter, Graphics } from "pixi.js";

import { addGlowLayer, applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/auraHelpers";
import { borderBoundsFromSize } from "@/ui/effects/shared/borderFrame";
import type { AuraDefinition, AuraFrameContext } from "@/ui/effects/types";

export const shadowAura: AuraDefinition = {
  id: "shadow",
  label: "Shadow",
  create(layers, mount, art) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const tendrils = addGlowLayer(layers.back, 0);
    tendrils.filters = [new BlurFilter({ strength: 8, quality: 4 })];
    const dark = new ColorMatrixFilter();
    dark.brightness(0.75, false);
    applyArtFilters(art, [dark]);

    const step = (frame: AuraFrameContext) => {
      const t = frame.time;
      tendrils.clear();
      const count = 8;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const reach = 20 + Math.sin(t * 0.8 + i) * 15;
        const x0 = Math.cos(a) * bounds.halfW * 0.9;
        const y0 = Math.sin(a) * bounds.halfH * 0.9;
        const x1 = Math.cos(a) * (bounds.halfW * 0.9 + reach);
        const y1 = Math.sin(a) * (bounds.halfH * 0.9 + reach);
        tendrils.moveTo(x0, y0);
        tendrils.bezierCurveTo(
          x0 + Math.sin(t + i) * 20,
          y0 + Math.cos(t + i) * 20,
          x1 - 10,
          y1 - 10,
          x1,
          y1,
        );
      }
      tendrils.stroke({ width: 6, color: 0x1a0028, alpha: 0.55 });
      tendrils.fill({ color: 0x330055, alpha: 0.15 });
    };

    return makeRuntime("shadow", step, noopDestroy(() => applyArtFilters(art, null), () => tendrils.destroy()));
  },
};
