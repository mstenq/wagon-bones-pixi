import { useRef, useState } from 'react';

import { DIFFICULTIES } from '@/game/Constants';
import { gameFacade } from '@/game/facade/gameFacade';
import { getHighestUnlockedDifficulty, isDifficultyUnlocked } from '@/game/UserStats';
import { useGameRunStore } from '@/game/store/reactHooks';
import { sceneActions } from '@/game/store/sceneStore';
import { navigateToRoundSelect } from '@/ui/roundSelect/roundSelectActions';
import type { DifficultyLevel } from '@/game/types';
import { ButtonElement } from '@/ui/components/Button/ButtonElement';
import { DifficultyCard } from '@/ui/components/menu/DifficultyCard';
import { MenuScreenLayout } from '@/ui/components/menu/MenuScreenLayout';
import { SeededRunControls } from '@/ui/components/menu/SeededRunControls';

export function DifficultySelectScreen() {
  const professionId = useGameRunStore((s) => s.professionId);
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>(1);
  const [seededRun, setSeededRun] = useState(false);
  const [seed, setSeed] = useState('');
  const prevProfessionId = useRef(professionId);

  if (professionId && professionId !== prevProfessionId.current) {
    prevProfessionId.current = professionId;
    const unlocked = getHighestUnlockedDifficulty(professionId);
    setSelectedLevel(unlocked);
  }

  const handleEmbark = () => {
    if (!professionId || !isDifficultyUnlocked(professionId, selectedLevel)) {
      return;
    }
    gameFacade.meta.setDifficulty(selectedLevel);
    const typedSeed = seed.trim();
    const runSeed = seededRun ? typedSeed || gameFacade.meta.generateRunSeed() : gameFacade.meta.generateRunSeed();
    gameFacade.meta.initRunRng(runSeed);
    gameFacade.meta.assignBosses();
    navigateToRoundSelect();
  };

  const footer = (
    <div className="flex flex-col gap-4">
      <SeededRunControls enabled={seededRun} seed={seed} onEnabledChange={setSeededRun} onSeedChange={setSeed} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ButtonElement variant="neutral" label="Back" onClick={() => sceneActions.setActiveScene('ProfessionSelect')} />
        <ButtonElement
          variant="primary"
          label="Embark"
          disabled={!professionId || !isDifficultyUnlocked(professionId, selectedLevel)}
          onClick={handleEmbark}
        />
      </div>
    </div>
  );

  return (
    <MenuScreenLayout footer={footer}>
      <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
        <header className="text-center">
          <h1 className="font-header m-0 text-3xl text-black">Choose Your Trail</h1>
          <p className="font-body m-0 mt-2 text-sm text-ui-panel-muted">
            Higher stakes stack penalties — pick how harsh the frontier will be
          </p>
        </header>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DIFFICULTIES.map((diff) => {
            const locked = !professionId || !isDifficultyUnlocked(professionId, diff.level);
            return (
              <DifficultyCard
                key={diff.id}
                difficulty={diff}
                selected={selectedLevel === diff.level}
                locked={locked}
                onSelect={() => setSelectedLevel(diff.level)}
              />
            );
          })}
        </div>
      </div>
    </MenuScreenLayout>
  );
}
