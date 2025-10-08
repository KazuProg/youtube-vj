import type { JsonValue } from "@/types/common";
import { useCallback } from "react";

const XWIN_SYNC_EVENT = "vj-xwin-sync";

interface StorageAdapter {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

const defaultStorageAdapter: StorageAdapter = {
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  getItem: (key: string) => localStorage.getItem(key),
  removeItem: (key: string) => localStorage.removeItem(key),
};

export const useXWinSync = <T extends JsonValue = JsonValue>(
  syncKey: string,
  storageAdapter: StorageAdapter = defaultStorageAdapter
) => {
  const writeToStorage = useCallback(
    (data: T) => {
      try {
        storageAdapter.setItem(syncKey, JSON.stringify(data));

        window.dispatchEvent(
          new CustomEvent(XWIN_SYNC_EVENT, {
            detail: { key: syncKey, data },
          })
        );
      } catch (error) {
        console.error("Error writing to storage:", error);
      }
    },
    [syncKey, storageAdapter]
  );

  const readFromStorage = useCallback((): T | null => {
    try {
      const stored = storageAdapter.getItem(syncKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error reading from storage:", error);
      return null;
    }
  }, [syncKey, storageAdapter]);

  const onXWinSync = useCallback(
    (callback: (data: T) => void) => {
      const handleCustomSync = (e: CustomEvent) => {
        if (e.detail.key === syncKey) {
          callback(e.detail.data);
        }
      };

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === syncKey && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            callback(data);
          } catch (error) {
            console.error("Error parsing storage event data:", error);
          }
        }
      };

      window.addEventListener(XWIN_SYNC_EVENT, handleCustomSync as EventListener);
      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener(XWIN_SYNC_EVENT, handleCustomSync as EventListener);
        window.removeEventListener("storage", handleStorageChange);
      };
    },
    [syncKey]
  );

  const clearStorage = useCallback(() => {
    try {
      storageAdapter.removeItem(syncKey);

      window.dispatchEvent(
        new CustomEvent(XWIN_SYNC_EVENT, {
          detail: { key: syncKey, data: null, cleared: true },
        })
      );
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }, [syncKey, storageAdapter]);

  return {
    writeToStorage,
    readFromStorage,
    onXWinSync,
    clearStorage,
  };
};
