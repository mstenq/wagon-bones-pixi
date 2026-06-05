import buttonUrl from '@/assets/sounds/button.ogg';
import cancelUrl from '@/assets/sounds/cancel.ogg';
import card1Url from '@/assets/sounds/card1.ogg';
import cardSlide2Url from '@/assets/sounds/cardSlide2.ogg';
import coinUrl from '@/assets/sounds/coin3.ogg';
import diceRollUrl from '@/assets/sounds/diceRoll.wav';
import diceRattleAndRollUrl from '@/assets/sounds/diceRattleAndRoll.wav';
import explosionReleaseUrl from '@/assets/sounds/explosion_release1.ogg';
import highlight1Url from '@/assets/sounds/highlight1.ogg';
import tarot1Url from '@/assets/sounds/tarot1.ogg';

/** Semantic SFX ids used by the Pixi UI (mirrors Phaser Preloader keys where applicable). */
export const SFX_IDS = [
  'button',
  'cancel',
  'card1',
  'cardSlide2',
  'coin',
  'diceRoll',
  'diceRattleAndRoll',
  'explosionRelease',
  'highlight1',
  'tarot1',
] as const;

export type SfxId = (typeof SFX_IDS)[number];

export const SFX_URLS: Record<SfxId, string> = {
  button: buttonUrl,
  cancel: cancelUrl,
  card1: card1Url,
  cardSlide2: cardSlide2Url,
  coin: coinUrl,
  diceRoll: diceRollUrl,
  diceRattleAndRoll: diceRattleAndRollUrl,
  explosionRelease: explosionReleaseUrl,
  highlight1: highlight1Url,
  tarot1: tarot1Url,
};
