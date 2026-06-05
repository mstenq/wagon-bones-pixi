import { useGameSceneStore } from '@/game/store/reactHooks';
import type { ActiveSceneKey } from '@/game/store/types';
import { DifficultySelectScreen } from '@/ui/screens/DifficultySelectScreen';
import { GameScreen } from '@/ui/screens/GameScreen';
import { InRunScenePlaceholder } from '@/ui/screens/InRunScenePlaceholder';
import { MainMenuScreen } from '@/ui/screens/MainMenuScreen';
import { ProfessionSelectScreen } from '@/ui/screens/ProfessionSelectScreen';
import { PayoutScreen } from '@/ui/screens/PayoutScreen';
import { RoundSelectScreen } from '@/ui/screens/RoundSelectScreen';
import { TrailEventScreen } from '@/ui/screens/TrailEventScreen';

const IN_RUN_PLACEHOLDER_SCENES: ActiveSceneKey[] = ['Shop', 'BoosterPack'];

export function SceneSwitch() {
  const activeScene = useGameSceneStore((s) => s.activeScene);

  switch (activeScene) {
    case 'MainMenu':
      return <MainMenuScreen />;
    case 'ProfessionSelect':
      return <ProfessionSelectScreen />;
    case 'DifficultySelect':
      return <DifficultySelectScreen />;
    case 'RoundSelect':
      return <RoundSelectScreen />;
    case 'Game':
      return <GameScreen />;
    case 'Payout':
      return <PayoutScreen />;
    case 'TrailEvent':
      return <TrailEventScreen />;
    default:
      if (IN_RUN_PLACEHOLDER_SCENES.includes(activeScene)) {
        return <InRunScenePlaceholder scene={activeScene} />;
      }
      return <MainMenuScreen />;
  }
}
