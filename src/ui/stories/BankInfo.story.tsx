import { useState } from "react";

import { BankInfo } from "@/ui/components/BankInfo/BankInfo";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelButtonClass } from "@/ui/styles/panelControls";

const DEFAULT_BALANCE = 15;

function randomIncrement(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function BankInfoStory() {
  const [balance, setBalance] = useState(DEFAULT_BALANCE);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => setBalance(DEFAULT_BALANCE)}
        >
          Reset
        </button>
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => setBalance((value) => value + randomIncrement())}
        >
          Increment
        </button>
      </div>

      <BankInfo balance={balance} />
    </div>
  );
}

const bankInfoStory: StoryDefinition = {
  name: "BankInfo",
  component: <BankInfoStory />,
};

export default bankInfoStory;
