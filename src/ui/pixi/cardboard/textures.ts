import { Assets, Texture } from "pixi.js";

import {
  CARDBOARD_BUTTON_IMAGES,
  CARDBOARD_BUTTON_VARIANTS,
  CARDBOARD_TILE_IMAGE,
  type CardboardButtonVariant,
} from "@/ui/cardboard/assets";

const TILE_ALIAS = "cardboard-tile";
const buttonAlias = (variant: CardboardButtonVariant) => `cardboard-button-${variant}`;

let tilePreload: Promise<void> | null = null;
let buttonPreload: Promise<void> | null = null;

function registerTileAsset(): void {
  if (!Assets.resolver.hasKey(TILE_ALIAS)) {
    Assets.add({ alias: TILE_ALIAS, src: CARDBOARD_TILE_IMAGE });
  }
}

function registerButtonAssets(): void {
  for (const variant of CARDBOARD_BUTTON_VARIANTS) {
    const alias = buttonAlias(variant);
    if (!Assets.resolver.hasKey(alias)) {
      Assets.add({ alias, src: CARDBOARD_BUTTON_IMAGES[variant] });
    }
  }
}

export function preloadCardboardTileTexture(): Promise<void> {
  registerTileAsset();
  tilePreload ??= Assets.load([TILE_ALIAS]).then(() => undefined);
  return tilePreload;
}

export function preloadCardboardButtonTextures(): Promise<void> {
  registerButtonAssets();
  buttonPreload ??= Assets.load(CARDBOARD_BUTTON_VARIANTS.map(buttonAlias)).then(() => undefined);
  return buttonPreload;
}

/** Await in React with `use(cardboardTileTexturesReady)` before panel nine-patch. */
export const cardboardTileTexturesReady = preloadCardboardTileTexture();

/** Await in React with `use(cardboardButtonTexturesReady)` before Pixi cardboard buttons. */
export const cardboardButtonTexturesReady = preloadCardboardButtonTextures();

export function getCardboardTileTexture(): Texture {
  return Assets.get<Texture>(TILE_ALIAS);
}

export function getCardboardButtonTexture(variant: CardboardButtonVariant): Texture {
  return Assets.get<Texture>(buttonAlias(variant));
}
