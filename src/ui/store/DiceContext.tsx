import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

import { DICE_COUNT, type DiceType } from "@/ui/components/Dice/config";

export type DiceContextValue = {
  diceType: DiceType;
  results: number[];
  order: number[];
  setOrder: (order: number[]) => void;
  isRolling: boolean;
  setDiceType: (type: DiceType) => void;
  roll: () => void;
  finishRoll: (results: number[]) => void;
  startRollRef: MutableRefObject<() => void>;
};

const DiceContext = createContext<DiceContextValue | null>(null);

export function DiceProvider({ children }: { children: ReactNode }) {
  const startRollRef = useRef<() => void>(() => {});

  const [diceType, setDiceType] = useState<DiceType>("standard");
  const [results, setResults] = useState(() => Array(DICE_COUNT).fill(1));
  const [order, setOrder] = useState(() =>
    Array.from({ length: DICE_COUNT }, (_, index) => index),
  );
  const [isRolling, setIsRolling] = useState(false);

  const roll = useCallback(() => {
    if (isRolling) {
      return;
    }
    setIsRolling(true);
    startRollRef.current();
  }, [isRolling]);

  const finishRoll = useCallback((next: number[]) => {
    setResults(next);
    setIsRolling(false);
  }, []);

  const value = useMemo<DiceContextValue>(
    () => ({
      diceType,
      results,
      order,
      setOrder,
      isRolling,
      setDiceType,
      roll,
      finishRoll,
      startRollRef,
    }),
    [diceType, results, order, isRolling, roll, finishRoll],
  );

  return <DiceContext.Provider value={value}>{children}</DiceContext.Provider>;
}

export function useDice(): DiceContextValue {
  const value = useContext(DiceContext);
  if (!value) {
    throw new Error("useDice must be used within DiceProvider");
  }
  return value;
}
