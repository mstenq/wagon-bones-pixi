import buttonUrl from '@/assets/sounds/button.ogg';
import card1Url from '@/assets/sounds/card1.ogg';
import cardSlide2Url from '@/assets/sounds/cardSlide2.ogg';
import diceRollUrl from '@/assets/sounds/diceRoll.wav';
import diceRattleAndRollUrl from '@/assets/sounds/diceRattleAndRoll.wav';
import highlight1Url from '@/assets/sounds/highlight1.ogg';

/** Semantic SFX ids used by the Pixi UI (mirrors Phaser Preloader keys where applicable). */
export const SFX_IDS = [
  'button',
  'card1',
  'cardSlide2',
  'diceRoll',
  'diceRattleAndRoll',
  'highlight1',
] as const;

export type SfxId = (typeof SFX_IDS)[number];

export const SFX_URLS: Record<SfxId, string> = {
  button: buttonUrl,
  card1: card1Url,
  cardSlide2: cardSlide2Url,
  diceRoll: diceRollUrl,
  diceRattleAndRoll: diceRattleAndRollUrl,
  highlight1: highlight1Url,
};
