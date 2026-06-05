import { Assets, Spritesheet, Texture, type SpritesheetData, type SpritesheetFrameData } from 'pixi.js';

export type SpritesheetLoader = {
  texturesReady: Promise<void>;
  getTexture: (frame: string) => Texture;
};

type TexturePackerArrayFrame = SpritesheetFrameData & {
  filename?: string;
};

/** TexturePacker JSON exports `frames` as an array; Pixi expects a filename-keyed record. */
export function normalizeSpritesheetData(data: SpritesheetData): SpritesheetData {
  const { frames } = data;
  if (!Array.isArray(frames)) {
    return data;
  }

  const normalizedFrames: Record<string, SpritesheetFrameData> = {};
  for (const entry of frames as TexturePackerArrayFrame[]) {
    const key = entry.filename;
    if (!key) {
      continue;
    }
    normalizedFrames[key] = {
      frame: entry.frame,
      rotated: entry.rotated,
      trimmed: entry.trimmed,
      sourceSize: entry.sourceSize,
      spriteSourceSize: entry.spriteSourceSize,
      anchor: entry.anchor,
      borders: entry.borders,
    };
  }

  return { ...data, frames: normalizedFrames };
}

export function createSpritesheetLoader(
  imageAlias: string,
  imageSrc: string,
  atlasData: SpritesheetData,
): SpritesheetLoader {
  const normalizedAtlasData = normalizeSpritesheetData(atlasData);
  let sheet: Spritesheet | null = null;
  let preloadPromise: Promise<void> | null = null;

  function preload(): Promise<void> {
    preloadPromise ??= (async () => {
      if (sheet) {
        return;
      }

      const texture = await Assets.load<Texture>({
        alias: imageAlias,
        src: imageSrc,
      });
      const parsed = new Spritesheet(texture, normalizedAtlasData);
      await parsed.parse();
      sheet = parsed;
    })().then(() => undefined);

    return preloadPromise;
  }

  function getTexture(frame: string): Texture {
    if (!sheet) {
      throw new Error(`Spritesheet "${imageAlias}" not loaded — await texturesReady first`);
    }
    return sheet.textures[frame] ?? Texture.EMPTY;
  }

  return {
    texturesReady: preload(),
    getTexture,
  };
}
