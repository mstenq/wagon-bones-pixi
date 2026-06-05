import { useSyncExternalStore } from 'react';

function subscribeToMediaQuery(query: string, onStoreChange: () => void) {
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener('change', onStoreChange);
  return () => mediaQueryList.removeEventListener('change', onStoreChange);
}

function getMediaQuerySnapshot(query: string) {
  return window.matchMedia(query).matches;
}

/** Subscribes to `window.matchMedia(query)` without `useEffect`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query),
    () => false,
  );
}
