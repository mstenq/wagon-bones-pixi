import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/** Passed to the playback runner after `endDay` to animate pouch fly-in. */
export type HandRefillFlyInRequest = {
  nextHandIds: readonly string[];
  previousRowIds: readonly string[];
  onComplete?: () => void;
};

export type DiceRowControllerHandlers = {
  sort: () => void;
  reroll: (ids: string[]) => void;
  handRefill: (request: HandRefillFlyInRequest) => void;
  getRollRowSnapshot: () => readonly string[];
};

export type DiceRowControllerValue = {
  visualOrder: readonly string[];
  rerollLockedIds: readonly string[];
  isAnimating: boolean;
  setVisualOrder: (order: string[]) => void;
  setRerollLockedIds: (ids: string[]) => void;
  clearRerollLocks: () => void;
  setAnimating: (value: boolean) => void;
  /** While true, phase heuristics skip instant hand resets — fly-in owns the transition. */
  setDeferHandReset: (value: boolean) => void;
  isDeferHandReset: () => boolean;
  bindHandlers: (handlers: DiceRowControllerHandlers) => void;
  getRollRowSnapshot: () => readonly string[];
  requestSort: () => void;
  requestRerollAnimation: (ids: string[]) => void;
  requestHandRefillFlyIn: (request: HandRefillFlyInRequest) => void;
};

const DiceRowControllerContext = createContext<DiceRowControllerValue | null>(null);

export function DiceRowControllerProvider({ children }: { children: ReactNode }) {
  const [visualOrder, setVisualOrderState] = useState<string[]>([]);
  const [rerollLockedIds, setRerollLockedIdsState] = useState<string[]>([]);
  const [isAnimating, setIsAnimatingState] = useState(false);
  const handlersRef = useRef<DiceRowControllerHandlers | null>(null);
  const deferHandResetRef = useRef(false);

  const setVisualOrder = useCallback((order: string[]) => {
    setVisualOrderState(order);
  }, []);

  const setRerollLockedIds = useCallback((ids: string[]) => {
    setRerollLockedIdsState(ids);
  }, []);

  const clearRerollLocks = useCallback(() => {
    setRerollLockedIdsState([]);
  }, []);

  const setAnimating = useCallback((value: boolean) => {
    setIsAnimatingState(value);
  }, []);

  const setDeferHandReset = useCallback((value: boolean) => {
    deferHandResetRef.current = value;
  }, []);

  const isDeferHandReset = useCallback(() => deferHandResetRef.current, []);

  const bindHandlers = useCallback((handlers: DiceRowControllerHandlers) => {
    handlersRef.current = handlers;
  }, []);

  const getRollRowSnapshot = useCallback(() => handlersRef.current?.getRollRowSnapshot() ?? [], []);

  const requestSort = useCallback(() => {
    handlersRef.current?.sort();
  }, []);

  const requestRerollAnimation = useCallback((ids: string[]) => {
    handlersRef.current?.reroll(ids);
  }, []);

  const requestHandRefillFlyIn = useCallback((request: HandRefillFlyInRequest) => {
    handlersRef.current?.handRefill(request);
  }, []);

  const value = useMemo<DiceRowControllerValue>(
    () => ({
      visualOrder,
      rerollLockedIds,
      isAnimating,
      setVisualOrder,
      setRerollLockedIds,
      clearRerollLocks,
      setAnimating,
      setDeferHandReset,
      isDeferHandReset,
      bindHandlers,
      getRollRowSnapshot,
      requestSort,
      requestRerollAnimation,
      requestHandRefillFlyIn,
    }),
    [
      visualOrder,
      rerollLockedIds,
      isAnimating,
      setVisualOrder,
      setRerollLockedIds,
      clearRerollLocks,
      setAnimating,
      setDeferHandReset,
      isDeferHandReset,
      bindHandlers,
      getRollRowSnapshot,
      requestSort,
      requestRerollAnimation,
      requestHandRefillFlyIn,
    ],
  );

  return <DiceRowControllerContext.Provider value={value}>{children}</DiceRowControllerContext.Provider>;
}

export function useDiceRowController(): DiceRowControllerValue {
  const value = useContext(DiceRowControllerContext);
  if (!value) {
    throw new Error('useDiceRowController must be used within DiceRowControllerProvider');
  }
  return value;
}
