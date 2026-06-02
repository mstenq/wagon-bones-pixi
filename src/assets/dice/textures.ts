import { Assets, Spritesheet, type SpritesheetData, type Texture } from "pixi.js";

import type { DiceType } from "@/data/dice";
import diceAtlasData from "@/assets/dice/dice.json";
import diceAtlasImage from "@/assets/dice/dice.png";

const STONE_FACE_FRAME = "stone.png";

let diceSheet: Spritesheet | null = null;
let preloadPromise: Promise<void> | null = null;

export function registerDiceAssets(): void {
  // Spritesheet is built manually from Vite-resolved image + JSON (see preloadDiceTextures).
}

export function preloadDiceTextures(): Promise<void> {
  preloadPromise ??= (async () => {
    if (diceSheet) {
      return;
    }

    const texture = await Assets.load<Texture>({
      alias: "dice-atlas-image",
      src: diceAtlasImage,
    });
    const sheet = new Spritesheet(texture, diceAtlasData as SpritesheetData);
    await sheet.parse();
    diceSheet = sheet;
  })().then(() => undefined);

  return preloadPromise;
}

/** Await in React with `use(texturesReady)` — no useEffect needed. */
export const texturesReady = preloadDiceTextures();

function getDiceSheet(): Spritesheet {
  if (!diceSheet) {
    throw new Error("Dice spritesheet not loaded — await texturesReady first");
  }
  return diceSheet;
}

export function getDiceFaceTexture(type: DiceType, face: number): Texture {
  const sheet = getDiceSheet();
  if (type === "stone") {
    return sheet.textures[STONE_FACE_FRAME]!;
  }
  const clamped = Math.min(12, Math.max(1, Math.round(face)));
  const frame = `${type}-${String(clamped).padStart(2, "0")}.png`;
  return sheet.textures[frame]!;
}

export type { DiceType };
