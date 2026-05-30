import { Graphics } from "pixi.js";

import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/auraHelpers";
import { addGlowLayer } from "@/ui/effects/auraHelpers";
import { borderBoundsFromSize, drawRoundedRectFrame } from "@/ui/effects/shared/borderFrame";
import { drawScanlines, drawScanSweep } from "@/ui/effects/shared/scanlines";
import {
  getChromaticAberrationFilter,
  setChromaticUniforms,
} from "@/ui/effects/filters/chromaticAberrationFilter";
import { getHueCycleFilter, setHueCycleUniforms } from "@/ui/effects/filters/hueCycleFilter";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import type { AuraDefinition, AuraFrameContext } from "@/ui/effects/types";

export const hologramAura: AuraDefinition = {
  id: "hologram",
  label: "Hologram",
  create(layers, mount, art) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const scan = addGlowLayer(layers.front, 0);
    const border = addGlowLayer(layers.front, 1);
    const glitch = addGlowLayer(layers.front, 2);
    const chroma = getChromaticAberrationFilter();
    const hue = getHueCycleFilter();
    applyArtFilters(art, [chroma, hue]);

    const step = (frame: AuraFrameContext) => {
      const t = frame.time;
      const hueVal = t * 0.8;
      setHueCycleUniforms(hue, hueVal, 0.4);
      setChromaticUniforms(chroma, 0.003 + Math.sin(t * 5) * 0.002, 0.8 + burstTimer(t, 2, 1.2, 0.1));

      drawScanlines(scan, bounds, 0.12, 3);
      const sweepY = ((t * 40) % (bounds.halfH * 2)) - bounds.halfH;
      drawScanSweep(scan, bounds, sweepY);

      border.clear();
      const hueColor = (Math.sin(t) * 0.5 + 0.5) * 0xffffff;
      drawRoundedRectFrame(border, bounds, 2, hueColor, 0.45);

      glitch.clear();
      if (burstTimer(t, 5, 0.7, 0.05) > 0.5) {
        glitch.rect(-bounds.halfW, (Math.random() - 0.5) * bounds.halfH, bounds.halfW * 2, 4);
        glitch.fill({ color: 0xff00ff, alpha: 0.3 });
      }
    };

    return makeRuntime("hologram", step, noopDestroy(() => applyArtFilters(art, null), () => {
      scan.destroy();
      border.destroy();
      glitch.destroy();
    }));
  },
};
