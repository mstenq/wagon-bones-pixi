import { Assets, Spritesheet, Texture, type SpritesheetData } from 'pixi.js';

export type SpritesheetLoader = {
  texturesReady: Promise<void>;
  getTexture: (frame: string) => Texture;
};

export function createSpritesheetLoader(
  imageAlias: string,
  imageSrc: string,
  atlasData: SpritesheetData,
): SpritesheetLoader {
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
      const parsed = new Spritesheet(texture, atlasData);
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
