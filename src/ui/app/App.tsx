import { GameCanvas } from "@/ui/app/GameCanvas";
import { RollDiceButton } from "@/ui/components/Dice/RollDiceButton";
import { DiceProvider } from "@/ui/store/DiceContext";

export function App() {
  return (
    <DiceProvider>
      <div className="game-shell">
        <GameCanvas />
        <RollDiceButton />
      </div>
    </DiceProvider>
  );
}

export default App;
