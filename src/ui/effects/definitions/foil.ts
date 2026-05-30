import { ColorMatrixFilter, Graphics } from "pixi.js";

import { addGlowLayer, applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { borderBoundsFromSize } from "@/ui/effects/shared/borderFrame";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const foilEffect: EffectDefinition = {
  id: "foil",
  label: "Foil",
  create(layers, mount, art) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const shine = addGlowLayer(layers.front, 0);
    const streak = addGlowLayer(layers.front, 1);
    const contrast = new ColorMatrixFilter();
    contrast.contrast(0.15, true);
    applyArtFilters(art, [contrast]);

    const step = (frame: EffectFrameContext) => {
      const t = frame.time;
      const px = frame.pointerNormX;
      const py = frame.pointerNormY;
      const sweep = (t * 0.15 + px * 0.3) % 1;
      const angle = Math.atan2(py - 0.5, px - 0.5) + t * 0.2;

      shine.clear();
      const w = bounds.halfW * 2;
      const h = bounds.halfH * 2;
      const cx = -bounds.halfW + sweep * w * 1.5 - w * 0.25;
      shine.poly([
        cx, -bounds.halfH,
        cx + 40, -bounds.halfH,
        cx + 80, bounds.halfH,
        cx + 20, bounds.halfH,
      ]);
      shine.fill({ color: 0xffffff, alpha: frame.hovered ? 0.22 : 0.12 });

      streak.clear();
      const len = Math.max(bounds.halfW, bounds.halfH) * 2;
      streak.moveTo(Math.cos(angle) * -len, Math.sin(angle) * -len);
      streak.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      streak.stroke({ width: 18, color: 0xe8e8f0, alpha: 0.08 + (frame.hovered ? 0.1 : 0) });
    };

    return makeRuntime("foil", step, noopDestroy(() => applyArtFilters(art, null), () => {
      shine.destroy();
      streak.destroy();
    }));
  },
};
