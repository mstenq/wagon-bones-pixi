// ─── GameInfo sidebar view-model (No Phaser imports) ───

import { GAMEPLAY } from '../../Constants';
import { formatScore } from '../../formatScore';
import { selectRunStatusTraits } from '../../runStatusTraits';
import { milesFromSave, ZERO } from '../../scoreMath';
import { getRunState } from '../runStore';
import { getRoundState } from '../roundStore';
import type { RunState } from '../types';
import { selectCurrentBoss, selectProfession, selectRoundReward, selectTargetMiles } from './runSelectors';
import { selectRunSidebarModel } from './uiSelectors';
import { selectRoundPhase, selectRoundTotalMiles } from './roundSelectors';

export type GameInfoViewModel = {
  title: string;
  subtitle?: string;
  iconSrc?: string;
  difficultyLevel: number;
  targetScore: number;
  targetScoreLabel: string;
  payoutAmount: number;
  roundScore: number;
  roundScoreLabel: string;
  professionName: string;
  modifiers: { id: string; polarity: 'positive' | 'negative' }[];
  handName: string;
  handLevel: number;
  chips: number;
  mult: number;
  hands: number;
  rerolls: number;
  legCurrent: number;
  legTotal: number;
  round: number;
  balance: number;
};

function phaseTitle(phase: string | null): string {
  if (phase === 'SELECT') return 'READY TO ROLL';
  if (phase === 'ROLL') return 'ROLL PHASE';
  if (phase === 'SCORE') return 'SCORING';
  if (phase === 'DAY_END') return 'DAY COMPLETE';
  return 'GAME';
}

function decimalToDisplayNumber(value: ReturnType<typeof milesFromSave>): number {
  const n = value.floor().toNumber();
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, n);
}

/** Stable revision token for React sidebar subscriptions. */
export function selectGameInfoRevision(state: RunState = getRunState()): string {
  const round = getRoundState();
  const traits = selectRunStatusTraits(state).map((trait) => trait.id).join(',');
  const overlay = round?.sidebarOverlay;
  const overlayKey = overlay
    ? `${overlay.title ?? ''}:${overlay.handName ?? ''}:${overlay.handLevel ?? ''}:${overlay.milesBaseSave ?? ''}:${overlay.multSave ?? ''}`
    : '';
  const bossId = selectCurrentBoss(state)?.id ?? '';

  return [
    state.balance,
    state.difficulty,
    state.leg,
    state.round,
    traits,
    bossId,
    round?.phase ?? 'none',
    overlayKey,
    round?.totalMiles?.toString() ?? '',
    selectTargetMiles(state).toString(),
  ].join('|');
}

export function selectGameInfoViewModel(run: RunState, options?: { titleOverride?: string }): GameInfoViewModel {
  const sidebar = selectRunSidebarModel(run);
  const round = getRoundState();
  const boss = selectCurrentBoss(run);
  const profession = selectProfession(run);
  const overlay = round?.sidebarOverlay;
  const phase = selectRoundPhase(round);

  let title = options?.titleOverride;
  if (!title) {
    if (overlay?.title) {
      title = overlay.title;
    } else if (boss) {
      title = boss.name;
    } else if (round) {
      title = phaseTitle(phase);
    } else {
      title = 'TRAIL MAP';
    }
  }

  const subtitle = boss?.description;
  const targetMiles = round?.config.targetMiles ?? selectTargetMiles(run);
  const totalMiles = selectRoundTotalMiles(round) ?? ZERO;

  const overlayMiles = overlay?.milesBaseSave ? milesFromSave(overlay.milesBaseSave) : null;
  const overlayMult = overlay?.multSave ? milesFromSave(overlay.multSave) : null;

  const handName = overlay?.handName || '—';
  const handLevel = overlay?.handLevel ?? 1;
  const chips = overlayMiles ? decimalToDisplayNumber(overlayMiles) : 0;
  const mult = overlayMult ? decimalToDisplayNumber(overlayMult) : 0;

  const traits = selectRunStatusTraits(run);

  return {
    title,
    subtitle,
    iconSrc: '',
    difficultyLevel: run.difficulty,
    targetScore: decimalToDisplayNumber(targetMiles),
    targetScoreLabel: formatScore(targetMiles),
    payoutAmount: selectRoundReward(run),
    roundScore: decimalToDisplayNumber(totalMiles),
    roundScoreLabel: formatScore(totalMiles),
    professionName: profession?.title ?? '—',
    modifiers: traits.map((trait) => ({ id: trait.id, polarity: trait.polarity })),
    handName,
    handLevel,
    chips,
    mult: overlayMult ? decimalToDisplayNumber(overlayMult) : mult,
    hands: sidebar.daysRemaining,
    rerolls: sidebar.rerolls,
    legCurrent: sidebar.leg,
    legTotal: GAMEPLAY.LEGS,
    round: sidebar.round,
    balance: sidebar.balance,
  };
}
