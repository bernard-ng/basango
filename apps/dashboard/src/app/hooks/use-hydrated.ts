import { useSyncExternalStore } from "react";

function subscribe() {
  return () => undefined;
}

export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
