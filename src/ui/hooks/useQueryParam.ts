import { useCallback, useRef, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

function notifyQueryParamListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeToSearchParams(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener('popstate', handler);
  listeners.add(handler);
  return () => {
    window.removeEventListener('popstate', handler);
    listeners.delete(handler);
  };
}

function readSearchParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

function writeSearchParam(key: string, serialized: string | null) {
  const params = new URLSearchParams(window.location.search);
  if (serialized === null) {
    params.delete(key);
  } else {
    params.set(key, serialized);
  }
  const search = params.toString();
  const url = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', url);
  notifyQueryParamListeners();
}

export type UseQueryParamOptions<T> = {
  default: T;
  parse?: (raw: string) => T | undefined;
  serialize?: (value: T) => string;
};

/**
 * Bidirectional sync for a single URL search param. Survives HMR and supports back/forward.
 */
export function useQueryParam<T>(key: string, options: UseQueryParamOptions<T>): [T, (value: T) => void] {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const getSnapshot = useCallback((): T => {
    const { default: defaultValue, parse, serialize } = optionsRef.current;
    const raw = readSearchParam(key);
    if (raw === null) {
      return defaultValue;
    }
    const parsed = parse ? parse(raw) : (raw as T);
    return parsed === undefined ? defaultValue : parsed;
  }, [key]);

  const value = useSyncExternalStore(subscribeToSearchParams, getSnapshot, getSnapshot);

  const setValue = useCallback(
    (next: T) => {
      const { default: defaultValue, serialize = String } = optionsRef.current;
      const serialized = serialize(next);
      const defaultSerialized = serialize(defaultValue);
      writeSearchParam(key, serialized === defaultSerialized ? null : serialized);
    },
    [key],
  );

  return [value, setValue];
}
