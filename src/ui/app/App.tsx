import { GameCanvas } from "@/ui/app/GameCanvas";
import { DiceProvider } from "@/ui/store/DiceContext";

export function App() {
  return (
    <DiceProvider>
      <GameCanvas />
    </DiceProvider>
  );
}

export default App;
