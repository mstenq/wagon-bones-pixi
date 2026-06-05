import { useState } from 'react';

import professions from '@/data/professions';
import { gameFacade } from '@/game/facade/gameFacade';
import { sceneActions } from '@/game/store/sceneStore';
import { ButtonElement } from '@/ui/components/Button/ButtonElement';
import { MenuScreenLayout } from '@/ui/components/menu/MenuScreenLayout';
import { ProfessionDetailPanel } from '@/ui/components/menu/ProfessionDetailPanel';
import { ProfessionGridCard } from '@/ui/components/menu/ProfessionGridCard';

export function ProfessionSelectScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectDifficulty = () => {
    if (!selectedId) return;
    gameFacade.meta.applyProfession(selectedId);
    gameFacade.meta.finalizeRunSetup();
    sceneActions.setActiveScene('DifficultySelect');
  };

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ButtonElement variant="neutral" label="Back" onClick={() => sceneActions.setActiveScene('MainMenu')} />
      <ButtonElement
        variant="primary"
        label="Select Difficulty"
        disabled={!selectedId}
        onClick={handleSelectDifficulty}
      />
    </div>
  );

  return (
    <MenuScreenLayout footer={footer}>
      <div className="flex min-h-full flex-col lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col border-black lg:w-2/3 lg:border-r-[length:var(--border-width-ui)]">
          <header className="shrink-0 px-4 pb-4 pt-6 text-center lg:px-6">
            <h1 className="font-header m-0 text-3xl text-black">Choose Your Profession</h1>
            <p className="font-body m-0 mt-2 text-sm text-ui-panel-muted">
              Each profession grants unique bonuses for the journey ahead
            </p>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 lg:px-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {professions.map((prof) => (
                <ProfessionGridCard
                  key={prof.id}
                  profession={prof}
                  selected={selectedId === prof.id}
                  onSelect={() => setSelectedId(prof.id)}
                />
              ))}
            </div>
          </div>
        </section>
        <aside className="flex min-h-80 min-w-0 flex-col lg:w-1/3">
          <ProfessionDetailPanel professionId={selectedId} />
        </aside>
      </div>
    </MenuScreenLayout>
  );
}
