// ─── Migrated game domain barrel (No Phaser imports) ───

export {
  gameFacade,
  gameRound,
  gameRun,
  gameConsumable,
  gameBoss,
  gameDiceSelection,
  gameEquipment,
  gameDice,
  gameShop,
  gamePack,
  gameTrail,
  gameMeta,
} from './facade';
export { initRoundSession, startRoundSession, enqueuePlayback, takePlayback, clearPlayback } from './facade';
export * from './facade/types';
export * from './store';
export type { Die, HandType, HandResult, ScoreResult, DifficultyLevel } from './types';
