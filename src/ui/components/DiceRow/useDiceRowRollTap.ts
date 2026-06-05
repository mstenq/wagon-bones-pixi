import { useCallback } from 'react';
import type { FederatedPointerEvent } from 'pixi.js';

import { useDiceRowController } from '@/ui/components/DiceRow/DiceRowController';
import {
  applyRollDieUiStateChange,
  getRollDieUiState,
  nextRollDieUiStateAfterClick,
  type RollDieUiState,
} from '@/ui/components/DiceRow/diceRowInteraction';
import { playSfx } from '@/ui/audio/sfx';
import { gameFacade } from '@/game/facade';
import type { RoundRuntimeState } from '@/game/store/types';
import type { PhaseState } from '@/game/types';
import type { RunState } from '@/game/store/types';
import { resolveDiceByIds } from '@/game/store/roundResolve';

export type UseDiceRowRollTapOptions = {
  phase: PhaseState | null;
  isRolling: boolean;
  round: RoundRuntimeState | null;
  run: RunState | null;
  selectedForScoreIds: readonly string[];
  bossLockedIds: ReadonlySet<string>;
};

function playRollDieTapSound(next: RollDieUiState): void {
  if (next === 'selected') {
    playSfx('highlight1', { volume: 0.3 });
    return;
  }
  playSfx('cardSlide2', { volume: 0.25 });
}

export function useDiceRowRollTap({
  phase,
  isRolling,
  round,
  run,
  selectedForScoreIds,
  bossLockedIds,
}: UseDiceRowRollTapOptions) {
  const controller = useDiceRowController();
  const rerollLockedIds = controller.rerollLockedIds;

  return useCallback(
    (_slotIndex: number, dieId: string, event: FederatedPointerEvent) => {
      if (phase !== 'ROLL' || isRolling || !round) {
        return;
      }

      const isRightClick = event.button === 2;
      const bossLocked = gameFacade.boss.isDiceLocked(dieId);
      const nextSelected = new Set(selectedForScoreIds);
      const nextLocked = new Set(rerollLockedIds);
      const current = getRollDieUiState(dieId, nextSelected, nextLocked, bossLockedIds);
      const next = nextRollDieUiStateAfterClick(current, isRightClick);
      applyRollDieUiStateChange(dieId, next, nextSelected, nextLocked, bossLocked);

      playRollDieTapSound(next);

      controller.setRerollLockedIds([...nextLocked]);

      const selectedDice = resolveDiceByIds([...nextSelected], round, run ?? undefined);
      gameFacade.round.setSelectedForScoreDice(selectedDice);
      gameFacade.round.updateHandPreviewOverlay(selectedDice);
    },
    [bossLockedIds, controller, isRolling, phase, rerollLockedIds, round, run, selectedForScoreIds],
  );
}
