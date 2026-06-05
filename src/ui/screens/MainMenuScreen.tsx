import { useState } from 'react';

import { clearAutoSaveStorage } from '@/game/AutoSave';
import { resetAllGameStores } from '@/game/store/resetAll';
import { sceneActions } from '@/game/store/sceneStore';
import { ButtonElement } from '@/ui/components/Button/ButtonElement';
import { MenuScreenLayout } from '@/ui/components/menu/MenuScreenLayout';
import { OptionsModal } from '@/ui/components/menu/OptionsModal';

export function MainMenuScreen() {
  const [optionsOpen, setOptionsOpen] = useState(false);

  const handleStartJourney = () => {
    clearAutoSaveStorage();
    resetAllGameStores();
    sceneActions.reset();
    sceneActions.setActiveScene('ProfessionSelect');
  };

  return (
    <>
      <MenuScreenLayout>
        <div className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-16 text-center">
          <div className="flex flex-col gap-3">
            <h1 className="font-header m-0 text-5xl tracking-wide text-black md:text-6xl">Wagon Bones</h1>
            <p className="font-body m-0 text-xl text-ui-panel-muted">A dice rolling journey</p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <ButtonElement variant="primary" label="Start Journey" onClick={handleStartJourney} fullWidth />
            <ButtonElement variant="neutral" label="Options" onClick={() => setOptionsOpen(true)} fullWidth />
          </div>
        </div>
      </MenuScreenLayout>
      {optionsOpen ? <OptionsModal onClose={() => setOptionsOpen(false)} /> : null}
    </>
  );
}
