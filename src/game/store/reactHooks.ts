// ─── Thin React selectors for migrated vanilla zustand stores ───

import { useStore } from 'zustand';
import type { RunState, SceneRuntimeState } from './types';
import { runStore } from './runStore';
import { roundStore, type RoundStoreState } from './roundStore';
import { sceneStore } from './sceneStore';

export function useGameRunStore<T>(selector: (state: RunState) => T): T {
  return useStore(runStore, selector);
}

/**
 * Subscribe to a stable string revision, then read derived run data during render.
 * Avoids returning fresh objects from useSyncExternalStore selectors (React 19).
 */
export function useRunStoreRevision<T>(
  revisionSelector: (state: RunState) => string,
  read: (state: RunState) => T,
): T {
  useGameRunStore(revisionSelector);
  return read(runStore.getState());
}

export function useGameRoundStore<T>(selector: (state: RoundStoreState) => T): T {
  return useStore(roundStore, selector);
}

export function useGameSceneStore<T>(selector: (state: SceneRuntimeState) => T): T {
  return useStore(sceneStore, selector);
}
