import { describe, test, expect, beforeEach } from 'bun:test';
import './setup';
import { GAMEPLAY } from '../Constants';
import { buildPayoutRows } from '../payoutPresentation';
import { computePayoutBreakdown } from '../runProgression';
import { resetTestRun, setTestDifficulty } from './testHelpers';
import { getRunState, runActions, setupActions } from '../store';

beforeEach(() => {
  resetTestRun();
});

function buildRowsForRun(daysRemaining = 1, rerollsRemaining = 0, investmentBonus = 0) {
  const run = getRunState();
  const payout = computePayoutBreakdown(run, daysRemaining, rerollsRemaining);
  return buildPayoutRows({
    payout,
    round: run.round,
    investmentBonus,
    run,
  });
}

describe('buildPayoutRows', () => {
  test('round 1 at difficulty 2+ shows Thin Supplies no-reward row', () => {
    setTestDifficulty(2);
    runActions.patch({ round: 1 });

    const rows = buildRowsForRun();
    expect(rows[0]).toEqual({
      label: 'Thin Supplies',
      amount: 'No reward',
      highlight: true,
      amountTone: 'error',
    });
  });

  test('boss round uses Defeat the Boss label', () => {
    runActions.patch({ round: GAMEPLAY.ROUNDS_PER_LEG });

    const rows = buildRowsForRun();
    expect(rows[0]?.label).toBe('Defeat the Boss');
  });

  test('outlaw profession suppresses interest rows', () => {
    setupActions.applyProfession('outlaw');
    runActions.patch({ balance: 25, interestCap: 25 });

    const rows = buildRowsForRun();
    const interestRow = rows.find((row) => row.label.startsWith('Interest'));
    expect(interestRow).toBeUndefined();
  });

  test('includes $0 interest row when interest is zero and no savings account', () => {
    runActions.patch({ balance: 0 });

    const rows = buildRowsForRun();
    expect(rows.some((row) => row.label === 'Interest ($1 per $5)' && row.amount === '$0')).toBe(true);
  });

  test('includes bounty payout row when investment bonus is positive', () => {
    const run = getRunState();
    const payout = computePayoutBreakdown(run, 0, 0);
    const rows = buildPayoutRows({
      payout,
      round: run.round,
      investmentBonus: 12,
      run,
    });

    expect(rows.some((row) => row.label === 'Bounty Payout' && row.amount === '$12')).toBe(true);
  });
});
