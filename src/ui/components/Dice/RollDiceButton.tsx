import { ButtonElement } from '@/ui/components/Button/ButtonElement';
import { gameFacade } from '@/game/facade';
import { useGameRoundStore } from '@/game/store/reactHooks';
import { selectHandDice } from '@/game/store/selectors/roundSelectors';

export function RollDiceButton() {
  const phase = useGameRoundStore((state) => state?.phase ?? null);
  const handCount = useGameRoundStore((state) => state?.handDiceIds.length ?? 0);
  const canRoll = phase === 'SELECT' && handCount > 0;

  return (
    <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
      <ButtonElement
        variant="primary"
        label={canRoll ? `Roll ${handCount} dice` : phase === 'ROLL' ? 'Rolled' : 'No hand'}
        disabled={!canRoll}
        onClick={() => {
          const ids = selectHandDice().map((die) => die.id);
          gameFacade.round.selectDiceForRoll(ids);
        }}
        className="min-w-48"
      />
    </div>
  );
}
