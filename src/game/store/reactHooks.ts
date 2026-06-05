// ─── Thin React selectors for migrated vanilla zustand stores ───

import { useStore } from 'zustand';
import type { RunState } from './types';
import { runStore } from './runStore';
import { roundStore, type RoundStoreState } from './roundStore';

export function useGameRunStore<T>(selector: (state: RunState) => T): T {
  return useStore(runStore, selector);
}

export function useGameRoundStore<T>(selector: (state: RoundStoreState) => T): T {
  return useStore(roundStore, selector);
}
