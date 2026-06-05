// ─── Round select column model (No Phaser imports) ───

import { GAMEPLAY } from './Constants';
import { formatScore } from './formatScore';
import { computeRoundReward, computeTargetMiles } from './runProgression';
import type { DifficultyLevel } from './types';
import type { RunState } from './store/types';
import {
  selectBlindSizeMultiplier,
  selectBossForLeg,
  selectSkipPreviewTagForRound,
} from './store/selectors/runSelectors';

export const ROUND_NAMES = ['Mile Marker', 'River Ford', 'Showdown'] as const;

export type RoundColumnState = 'skipped' | 'complete' | 'select' | 'upcoming';

export type RoundCardViewModel = {
  round: number;
  status: RoundColumnState;
  title: string;
  targetScore: number;
  targetScoreLabel: string;
  rewardAmount: number;
  trailTag?: string;
  showActions: boolean;
  showBossReroll: boolean;
};

export function getRoundColumnState(
  round: number,
  currentRound: number,
  skippedRoundsThisLeg: number[],
): RoundColumnState {
  if (skippedRoundsThisLeg.includes(round)) return 'skipped';
  if (round < currentRound) return 'complete';
  if (round === currentRound) return 'select';
  return 'upcoming';
}

export function targetMilesForRound(
  leg: number,
  round: number,
  permitScoreReduction: number,
  difficulty: DifficultyLevel,
  run: RunState,
): ReturnType<typeof computeTargetMiles> {
  const boss = round === GAMEPLAY.ROUNDS_PER_LEG ? selectBossForLeg(run, leg) : null;
  return computeTargetMiles(leg, round, permitScoreReduction, difficulty, boss, selectBlindSizeMultiplier(run));
}

export function rewardForRound(round: number, difficulty: DifficultyLevel): number {
  return computeRoundReward(round, difficulty);
}

function targetScoreNumber(value: ReturnType<typeof computeTargetMiles>): number {
  const n = value.floor().toNumber();
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, n);
}

/** Stable primitive for store subscriptions — do not subscribe to `buildLegRoundCardModels` directly. */
export function selectRoundSelectRevision(run: RunState): string {
  return JSON.stringify({
    leg: run.leg,
    round: run.round,
    difficulty: run.difficulty,
    permitScoreReduction: run.permitScoreReduction,
    skipped: run.skippedRoundsThisLeg,
    preview: run.roundSkipPreviewTags,
    bosses: run.bossAssignmentIds,
    balance: run.balance,
    bossRerollsUsed: run.bossRerollsUsedThisLeg,
    permits: run.purchasedPermits.join('|'),
  });
}

export function buildLegRoundCardModels(run: RunState): RoundCardViewModel[] {
  const models: RoundCardViewModel[] = [];

  for (let round = 1; round <= GAMEPLAY.ROUNDS_PER_LEG; round++) {
    const status = getRoundColumnState(round, run.round, run.skippedRoundsThisLeg);
    const isSkippable = round <= 2;
    const skipPreviewTag =
      isSkippable && !run.skippedRoundsThisLeg.includes(round) ? selectSkipPreviewTagForRound(run, round) : undefined;
    const targetMiles = targetMilesForRound(run.leg, round, run.permitScoreReduction, run.difficulty, run);
    const isBoss = round === GAMEPLAY.ROUNDS_PER_LEG;

    models.push({
      round,
      status,
      title: ROUND_NAMES[round - 1] ?? `Round ${round}`,
      targetScore: targetScoreNumber(targetMiles),
      targetScoreLabel: formatScore(targetMiles),
      rewardAmount: rewardForRound(round, run.difficulty),
      trailTag: skipPreviewTag ? '?' : undefined,
      showActions: status === 'select',
      showBossReroll: status === 'select' && isBoss,
    });
  }

  return models;
}
