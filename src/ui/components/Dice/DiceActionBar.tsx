import { useCallback, useMemo, useState } from 'react';

import { advanceAfterScore } from '@/ui/components/Dice/advanceAfterScore';
import { ButtonElement } from '@/ui/components/Button/ButtonElement';
import { useDiceRowController } from '@/ui/components/DiceRow/DiceRowController';
import { playSfx } from '@/ui/audio/sfx';
import { idsEligibleForReroll } from '@/ui/components/DiceRow/diceRowInteraction';
import { gameFacade } from '@/game/facade';
import { prepareScoreSidebar } from '@/game/scoring/prepareScoreSidebar';
import { useGameRoundStore } from '@/game/store/reactHooks';
import { resolveDiceByIds } from '@/game/store/roundResolve';
import { getRoundState } from '@/game/store/roundStore';
import {
  selectHandDice,
  selectRerollsRemaining,
  selectRoundTotalMiles,
} from '@/game/store/selectors/roundSelectors';

const TOAST_DISMISS_MS = 2000;
const EMPTY_IDS: readonly string[] = [];

function selectedIdsInVisualOrder(visualOrder: readonly string[], selectedIds: readonly string[]): string[] {
  const selectedSet = new Set(selectedIds);
  return visualOrder.filter((id) => selectedSet.has(id));
}

export function DiceActionBar() {
  const controller = useDiceRowController();

  const phase = useGameRoundStore((state) => state?.phase ?? null);
  const rerollsRemaining = useGameRoundStore((state) => state?.rerollsRemaining ?? 0);
  const selectedIds = useGameRoundStore((state) => state?.selectedForScoreIds ?? EMPTY_IDS);
  const rolledDice = useGameRoundStore((state) => state?.rolledDice);
  const handCount = useGameRoundStore((state) => state?.handDiceIds.length ?? 0);

  const rolledIds = useMemo(
    () => (rolledDice ? rolledDice.map((ref) => ref.id) : EMPTY_IDS),
    [rolledDice],
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, TOAST_DISMISS_MS);
  }, []);

  const visualOrder = controller.visualOrder;
  const rerollLockedIds = controller.rerollLockedIds;
  const isAnimating = controller.isAnimating;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const rerollLockedSet = useMemo(() => new Set(rerollLockedIds), [rerollLockedIds]);

  const selectedCount = selectedIds.length;
  const effectiveRolledIds = rolledIds.length > 0 ? rolledIds : visualOrder;
  const rerollEligibleCount = idsEligibleForReroll(effectiveRolledIds, selectedSet, rerollLockedSet).length;
  const canUseReroll = gameFacade.round.canUseReroll();
  const hasRerolls = selectRerollsRemaining() > 0;

  const bossWarning =
    phase === 'ROLL' && selectedCount > 0 ? gameFacade.round.getBossScoreWarning([...selectedIds]) : null;

  const rerollLabel = useMemo(() => {
    if (!hasRerolls) {
      return 'No Re-rolls';
    }
    if (!canUseReroll) {
      return `Day 1: no re-rolls (${rerollsRemaining} from Day 2)`;
    }
    if (rerollEligibleCount === 0) {
      return `Re-roll 0 (${rerollsRemaining} remaining)`;
    }
    if (rerollEligibleCount === effectiveRolledIds.length) {
      return `Re-roll All (${rerollsRemaining} remaining)`;
    }
    return `Re-roll ${rerollEligibleCount} (${rerollsRemaining} remaining)`;
  }, [canUseReroll, effectiveRolledIds.length, hasRerolls, rerollEligibleCount, rerollsRemaining]);

  const canRoll = phase === 'SELECT' && handCount > 0 && !isAnimating;
  const canScore = phase === 'ROLL' && selectedCount > 0 && !isAnimating;
  const canReroll = phase === 'ROLL' && rerollEligibleCount > 0 && canUseReroll && !isAnimating;
  const showRollPhaseControls = phase === 'ROLL';

  const handleRoll = () => {
    if (isAnimating) {
      return;
    }
    playSfx('button', { volume: 0.4 });
    const order = visualOrder.length > 0 ? visualOrder : selectHandDice().map((die) => die.id);
    controller.clearRerollLocks();
    gameFacade.round.setSelectedForScoreDice([]);
    gameFacade.round.clearHandPreviewOverlay();
    gameFacade.round.selectDiceForRoll([...order]);
  };

  const handleScore = () => {
    if (isAnimating) {
      return;
    }
    playSfx('button', { volume: 0.4 });
    const round = getRoundState();
    if (!round) {
      return;
    }

    const order = visualOrder.length > 0 ? visualOrder : effectiveRolledIds;
    const scoreIds = selectedIdsInVisualOrder(order, selectedIds);
    if (scoreIds.length === 0) {
      return;
    }

    const validation = gameFacade.round.validateScoreSelection([...scoreIds]);
    if (!validation.allowed) {
      showToast(validation.reason ?? 'Cannot play this hand');
      return;
    }

    const diceInOrder = resolveDiceByIds([...order], round);
    gameFacade.round.syncRolledDiceFromFaces(diceInOrder);

    const roundScoreBefore = selectRoundTotalMiles() ?? round.totalMiles;
    const previousRowIds = order.length > 0 ? order : controller.getRollRowSnapshot();
    // `submitScore` enqueues `hand-upgrades` / `score` on playbackQueue; Pixi does not
    // drain them yet — see src/ui/playback/gameSceneRunner.ts.
    const result = gameFacade.round.submitScore([...scoreIds], { deferConsumableGrants: true });
    if (!result) {
      showToast('Could not score');
      return;
    }

    prepareScoreSidebar(result, roundScoreBefore);
    controller.clearRerollLocks();
    // Keep selectedForScoreIds until endDay (Phaser onContinue → endDay). Clearing early makes
    // endDay think nothing was scored, so no pouch refill and scored dice stay as carryover.
    advanceAfterScore({
      onNextDay: (nextHandIds) => {
        controller.requestHandRefillFlyIn({ nextHandIds, previousRowIds });
      },
    });
  };

  const handleReroll = () => {
    if (isAnimating) {
      return;
    }
    playSfx('button', { volume: 0.4 });
    const idsToReroll = idsEligibleForReroll(effectiveRolledIds, selectedSet, rerollLockedSet);
    if (idsToReroll.length === 0) {
      return;
    }

    const success = gameFacade.round.rerollUnlockedDice(idsToReroll);
    if (!success) {
      if (selectRerollsRemaining() > 0 && !gameFacade.round.canUseReroll()) {
        showToast('No re-rolls on Day 1');
      }
      return;
    }

    controller.requestRerollAnimation(idsToReroll);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2">
      {toastMessage ? (
        <p className="pointer-events-auto m-0 rounded bg-black/80 px-4 py-2 font-body text-sm text-white">
          {toastMessage}
        </p>
      ) : null}
      {bossWarning ? (
        <p className="pointer-events-none m-0 max-w-md text-center font-body text-sm text-ui-modifier-negative">
          {bossWarning}
        </p>
      ) : null}
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        {showRollPhaseControls ? (
          <ButtonElement
            variant="neutral"
            label="Sort"
            disabled={isAnimating}
            onClick={() => {
              if (isAnimating) {
                return;
              }
              playSfx('button', { volume: 0.4 });
              controller.requestSort();
            }}
            className="min-w-24"
          />
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {canRoll ? (
            <ButtonElement
              variant="primary"
              label={`Roll ${handCount} dice`}
              onClick={handleRoll}
              className="min-w-48"
            />
          ) : null}
          {showRollPhaseControls ? (
            <>
              <ButtonElement
                variant="primary"
                label={selectedCount > 0 ? `Score ${selectedCount} Dice` : 'Select Dice to Score'}
                disabled={!canScore}
                onClick={handleScore}
                className="min-w-48"
              />
              <ButtonElement
                variant="neutral"
                label={rerollLabel}
                disabled={!canReroll}
                onClick={handleReroll}
                className="min-w-48"
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
