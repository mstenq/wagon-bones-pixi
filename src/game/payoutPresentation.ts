import { GAMEPLAY } from './Constants';
import type { PayoutBreakdown, PayoutRow, RunState } from './store/types';
import { selectProfession } from './store/selectors/runSelectors';

export type BuildPayoutRowsInput = {
  payout: PayoutBreakdown;
  round: number;
  investmentBonus: number;
  run: RunState;
};

function payoutRoundRowLabel(round: number): string {
  if (round === GAMEPLAY.ROUNDS_PER_LEG) {
    return 'Defeat the Boss';
  }
  if (round === 2) {
    return 'Complete Round 2';
  }
  return 'Complete Round 1';
}

/** Labels and amounts for the payout breakdown UI (computed at scene entry). */
export function buildPayoutRows({ payout, round, investmentBonus, run }: BuildPayoutRowsInput): PayoutRow[] {
  const rows: PayoutRow[] = [];
  const profession = selectProfession(run);

  if (payout.roundReward === 0 && run.difficulty >= 2 && round === 1) {
    rows.push({
      label: 'Thin Supplies',
      amount: 'No reward',
      highlight: true,
      amountTone: 'error',
    });
  } else {
    rows.push({
      label: payoutRoundRowLabel(round),
      amount: `$${payout.roundReward}`,
      highlight: true,
    });
  }

  if (payout.dayBonus > 0) {
    rows.push({
      label: `Remaining Day${payout.dayBonus !== 1 ? 's' : ''} ($1 each)`,
      amount: `$${payout.dayBonus}`,
    });
  }

  const noInterest = !!(profession?.modifiers as Record<string, unknown>)?.noInterest;
  if (!noInterest) {
    if (payout.interest > 0) {
      rows.push({
        label: `Interest ($1 per $${GAMEPLAY.INTEREST_PER}, $${run.interestCap / GAMEPLAY.INTEREST_PER} max)`,
        amount: `$${payout.interest}`,
      });
    } else if (payout.savingsAccountInterest === 0) {
      rows.push({
        label: `Interest ($1 per $${GAMEPLAY.INTEREST_PER})`,
        amount: '$0',
      });
    }
    if (payout.savingsAccountInterest > 0) {
      rows.push({
        label: `Savings Account ($${payout.savingsAccountRate} per $${payout.savingsAccountChunk})`,
        amount: `$${payout.savingsAccountInterest}`,
      });
    }
  }

  if (payout.rerollBonus > 0) {
    rows.push({
      label: 'Unused Rerolls ($1 each)',
      amount: `$${payout.rerollBonus}`,
    });
  }

  if (payout.equipmentMoney > 0) {
    rows.push({
      label: 'Equipment Bonus',
      amount: `$${payout.equipmentMoney}`,
      highlight: true,
    });
  }

  if (investmentBonus > 0) {
    rows.push({
      label: 'Bounty Payout',
      amount: `$${investmentBonus}`,
      highlight: true,
    });
  }

  return rows;
}
