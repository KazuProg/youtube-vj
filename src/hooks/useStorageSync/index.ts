import LocalStorageManager from "@/core/storage/LocalStorageManager";
import { useCallback, useMemo, useSyncExternalStore } from "react";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const storeCache = new Map<string, LocalStorageManager<any>>();

export const useStorageSync = <T>(
  syncKey: string,
  defaultValue: T,
  config?: { overwrite?: boolean }
) => {
  const store = useMemo(() => {
    if (!storeCache.has(syncKey)) {
      storeCache.set(syncKey, new LocalStorageManager(syncKey, defaultValue, config?.overwrite));
    }
    return storeCache.get(syncKey) as LocalStorageManager<T>;
  }, [syncKey, defaultValue, config?.overwrite]);

  const data = useSyncExternalStore(store.subscribe, store.getSnapshot);

  const setData = useCallback((val: T) => store.set(val), [store]);
  const clearData = useCallback(() => store.clear(), [store]);

  return {
    data,
    setData,
    clearData,
  };
};
