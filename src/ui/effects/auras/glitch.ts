import { Graphics } from "pixi.js";

import { addGlowLayer, applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/auraHelpers";
import { borderBoundsFromSize } from "@/ui/effects/shared/borderFrame";
import {
  getChromaticAberrationFilter,
  setChromaticUniforms,
} from "@/ui/effects/filters/chromaticAberrationFilter";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import type { AuraDefinition, AuraFrameContext } from "@/ui/effects/types";

export const glitchAura: AuraDefinition = {
  id: "glitch",
  label: "Glitch",
  create(layers, mount, art) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const tears = addGlowLayer(layers.front, 0);
    const blocks = addGlowLayer(layers.front, 1);
    const chroma = getChromaticAberrationFilter();
    applyArtFilters(art, [chroma]);

    const step = (frame: AuraFrameContext) => {
      const t = frame.time;
      const burst = burstTimer(t, 3, 0.9, 0.08);
      setChromaticUniforms(chroma, 0.006 + burst * 0.012, 1);

      const jitterX = burst > 0.4 ? (Math.random() - 0.5) * 4 : 0;
      const jitterY = burst > 0.4 ? (Math.random() - 0.5) * 4 : 0;
      art.setJitter(jitterX, jitterY);

      tears.clear();
      blocks.clear();
      if (burst > 0.2) {
        for (let i = 0; i < 4; i++) {
          const y = (Math.random() - 0.5) * bounds.halfH * 2;
          tears.rect(-bounds.halfW, y, bounds.halfW * 2, 3 + Math.random() * 4);
          tears.fill({ color: 0xff0044, alpha: 0.35 });
        }
        for (let i = 0; i < 6; i++) {
          blocks.rect(
            (Math.random() - 0.5) * bounds.halfW * 2,
            (Math.random() - 0.5) * bounds.halfH * 2,
            8 + Math.random() * 20,
            8 + Math.random() * 12,
          );
          blocks.fill({ color: Math.random() > 0.5 ? 0x00ff88 : 0x0088ff, alpha: 0.5 });
        }
      }
    };

    return makeRuntime("glitch", step, noopDestroy(() => applyArtFilters(art, null), () => {
      tears.destroy();
      blocks.destroy();
      art.setJitter(0, 0);
    }));
  },
};
