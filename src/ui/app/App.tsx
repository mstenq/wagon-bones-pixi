import { SceneSwitch } from '@/ui/app/SceneSwitch';
import { UiPrimaryProvider } from '@/ui/theme/UiPrimaryProvider';

export function App() {
  return (
    <UiPrimaryProvider className="box-border flex h-dvh w-full flex-col pt-safe-top pr-safe-right pb-safe-bottom pl-safe-left">
      <SceneSwitch />
    </UiPrimaryProvider>
  );
}

export default App;
