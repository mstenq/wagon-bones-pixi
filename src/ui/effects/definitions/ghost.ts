import { ColorMatrixFilter, Sprite } from "pixi.js";

import { getEffectTexture } from "@/assets/effects/textures";
import {
  addGlowLayer,
  addSpriteLayer,
  applyArtFilters,
  makeRuntime,
  noopDestroy,
} from "@/ui/effects/effectHelpers";
import { drawCardFrameStroke } from "@/ui/effects/shared/borderFrame";
import { applyBlurredGlow } from "@/ui/effects/shared/glow";
import { boundsFromCtx } from "@/ui/effects/effectHelpers";
import { orbitPosition } from "@/ui/effects/shared/orbit";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import { drawSoftGlow } from "@/ui/effects/shared/glow";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const ghostEffect: EffectDefinition = {
  id: "ghost",
  label: "Ghost",
  create(layers, mount, art) {
    const bounds = boundsFromCtx(mount);
    const glow = addGlowLayer(layers.back, 0);
    applyBlurredGlow(glow, mount.width, mount.height, mount.padding, 14);
    const border = addGlowLayer(layers.front, 0);
    const wispTex = getEffectTexture("wisp");
    const faceTex = getEffectTexture("ghostFace");
    const wisps: Sprite[] = [];
    for (let i = 0; i < 4; i++) {
      const s = addSpriteLayer(layers.front, wispTex, 1 + i);
      if (s) wisps.push(s);
    }
    const face = addSpriteLayer(layers.front, faceTex, 5);
    const desat = new ColorMatrixFilter();
    desat.desaturate();
    applyArtFilters(art, [desat]);

    let artAlpha = 1;

    const step = (frame: EffectFrameContext) => {
      const t = frame.time;
      const phase = (Math.sin(t * 1.5) + 1) * 0.5;
      artAlpha = 0.88 + phase * 0.12;
      art.applyFilters([desat]);

      drawSoftGlow(glow, bounds.halfW, bounds.halfH, 0x608888, 0.15, 4, mount.hostKind);
      border.clear();
      drawCardFrameStroke(border, bounds, mount.hostKind, 2, 0x88bbbb, 0.25);

      wisps.forEach((w, i) => {
        const pos = orbitPosition(t, bounds.halfW * 0.95, bounds.halfH * 0.75, 0.6 + i * 0.1, i);
        w.position.set(pos.x, pos.y);
        w.rotation = t + i;
        w.alpha = 0.35 + Math.sin(t * 2 + i) * 0.2;
        w.scale.set(0.5, 0.7);
      });

      if (face) {
        const flash = burstTimer(t, 7, 4.5, 0.2);
        face.alpha = flash * 0.5;
        face.scale.set(0.6);
        face.y = Math.sin(t * 0.4) * bounds.halfH * 0.2;
      }
    };

    return makeRuntime(
      "ghost",
      (frame) => {
        step(frame);
        art.setJitter(0, 0);
      },
      noopDestroy(
        () => applyArtFilters(art, null),
        () => {
          glow.destroy();
          border.destroy();
          wisps.forEach((w) => w.destroy());
          face?.destroy();
        },
      ),
    );
  },
};
