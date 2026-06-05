import { Assets, Texture } from 'pixi.js';

import { EFFECT_IMAGES, type EffectImageKey } from '@/assets/effects/images';

const effectAlias = (key: EffectImageKey) => `effect-${key}`;

const EFFECT_KEYS = Object.keys(EFFECT_IMAGES) as EffectImageKey[];

let preloadPromise: Promise<void> | null = null;

export function registerEffectAssets(): void {
  for (const key of EFFECT_KEYS) {
    const alias = effectAlias(key);
    if (!Assets.resolver.hasKey(alias)) {
      Assets.add({ alias, src: EFFECT_IMAGES[key] });
    }
  }
}

export function preloadEffectTextures(): Promise<void> {
  registerEffectAssets();
  preloadPromise ??= Assets.load(EFFECT_KEYS.map(effectAlias)).then(() => undefined);
  return preloadPromise;
}

/** Await in React with `use(effectsTexturesReady)` — no useEffect needed. */
export const effectsTexturesReady = preloadEffectTextures();

export function getEffectTexture(key: EffectImageKey): Texture | null {
  const alias = effectAlias(key);
  try {
    return Assets.get<Texture>(alias);
  } catch {
    try {
      return Texture.from(EFFECT_IMAGES[key]);
    } catch {
      return null;
    }
  }
}
