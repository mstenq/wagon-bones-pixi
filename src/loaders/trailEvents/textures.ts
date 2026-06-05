import { Assets, Texture } from 'pixi.js';

import { trailEventImagePath, trailEventSpyImagePath } from '@/game/trailEventAssets';

const ASSETS_GLOB_PREFIX = '../../assets/';

const trailEventUrlLoaders = import.meta.glob<string>('../../assets/trail-events/*.png', {
  import: 'default',
  query: '?url',
});

const trailEventSpyUrlLoaders = import.meta.glob<string>('../../assets/trail-events-spy/*.png', {
  import: 'default',
  query: '?url',
});

const texturePromises = new Map<string, Promise<Texture>>();

function assetGlobPath(relativePath: string): string {
  return `${ASSETS_GLOB_PREFIX}${relativePath}`;
}

function warnMissingTrailAsset(kind: 'primary' | 'spy', eventId: string): void {
  if (import.meta.env.DEV) {
    console.warn(`Missing trail event ${kind} asset for "${eventId}"`);
  }
}

function loadTextureFromGlob(
  globPath: string,
  loaders: Record<string, () => Promise<string>>,
  cacheKey: string,
  missingLabel: 'primary' | 'spy',
  eventId: string,
): Promise<Texture> {
  const cached = texturePromises.get(cacheKey);
  if (cached) {
    return cached;
  }

  const loadUrl = loaders[globPath];
  if (!loadUrl) {
    warnMissingTrailAsset(missingLabel, eventId);
    return Promise.resolve(Texture.EMPTY);
  }

  const promise = loadUrl()
    .then((url) => Assets.load<Texture>({ alias: cacheKey, src: url }))
    .then(() => Assets.get<Texture>(cacheKey))
    .catch(() => {
      warnMissingTrailAsset(missingLabel, eventId);
      return Texture.EMPTY;
    });

  texturePromises.set(cacheKey, promise);
  return promise;
}

/** Lazy-load a trail event illustration by id. Suspend in React with `use(...)`. */
export function loadTrailEventTexture(eventId: string): Promise<Texture> {
  return loadTextureFromGlob(
    assetGlobPath(trailEventImagePath(eventId)),
    trailEventUrlLoaders,
    `trail-event:${eventId}`,
    'primary',
    eventId,
  );
}

/** Lazy-load a spyglass preview illustration by id. Suspend in React with `use(...)`. */
export function loadTrailEventSpyTexture(eventId: string): Promise<Texture> {
  return loadTextureFromGlob(
    assetGlobPath(trailEventSpyImagePath(eventId)),
    trailEventSpyUrlLoaders,
    `trail-event-spy:${eventId}`,
    'spy',
    eventId,
  );
}
