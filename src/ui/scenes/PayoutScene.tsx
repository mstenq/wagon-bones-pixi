import { useMemo } from 'react';

import { GAMEPLAY } from '@/game/Constants';
import { formatScore } from '@/game/formatScore';
import { milesFromSave } from '@/game/scoreMath';
import { useGameSceneStore } from '@/game/store/reactHooks';
import { Button } from '@/ui/components/Button/Button';
import { PayoutPanel } from '@/ui/components/PayoutPanel/PayoutPanel';
import { collectPayoutAndContinue } from '@/ui/payout/payoutActions';
import { computePayoutLayout } from '@/ui/payout/payoutLayout';

export type PayoutSceneProps = {
  contentW: number;
  contentH: number;
};

function payoutRoundTitle(round: number): string {
  if (round === GAMEPLAY.ROUNDS_PER_LEG) {
    return 'Boss Defeated!';
  }
  return 'Round Complete!';
}

export function PayoutScene({ contentW, contentH }: PayoutSceneProps) {
  const payoutState = useGameSceneStore((s) => s.payout);
  if (!payoutState) {
    return null;
  }

  const { breakdown, presentation, rows } = payoutState;

  const layout = useMemo(() => computePayoutLayout(contentW, contentH, rows), [contentH, contentW, rows]);

  const totalMiles = milesFromSave(presentation.totalMilesSave);
  const targetMiles = milesFromSave(presentation.targetMilesSave);
  const totalEarnings = breakdown.total + presentation.investmentBonus;

  const title = payoutRoundTitle(presentation.round);
  const subtitle = `Leg ${presentation.leg} — Round ${presentation.round}/${GAMEPLAY.ROUNDS_PER_LEG}`;
  const scoreLine = `${formatScore(totalMiles)} / ${formatScore(targetMiles)} miles`;

  return (
    <pixiContainer sortableChildren eventMode="passive">
      <PayoutPanel
        x={layout.panel.centerX}
        y={layout.panel.centerY}
        width={layout.panel.width}
        height={layout.panel.height}
        title={title}
        subtitle={subtitle}
        scoreLine={scoreLine}
        rows={rows}
      />

      <Button
        variant="primary"
        label={`Collect $${totalEarnings} & Continue`}
        x={layout.contentCX}
        y={layout.buttonY}
        width={layout.buttonWidth}
        height={layout.buttonHeight}
        onClick={collectPayoutAndContinue}
      />
    </pixiContainer>
  );
}
