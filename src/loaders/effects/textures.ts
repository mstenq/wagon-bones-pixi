import { Assets, Texture } from 'pixi.js';

import { EFFECT_IMAGES, type EffectImageKey } from '@/loaders/effects/images';

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

export function getEffectTexture(key: EffectImageKey): Texture {
  const alias = effectAlias(key);
  if (!Assets.resolver.hasKey(alias)) {
    if (import.meta.env.DEV) {
      console.warn(`Effect texture "${key}" not loaded — await effectsTexturesReady before use`);
    }
    return Texture.EMPTY;
  }
  return Assets.get<Texture>(alias);
}
