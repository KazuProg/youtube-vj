import type { JsonValue } from "@/types";
import { useCallback, useEffect, useRef } from "react";

const LOCAL_STORAGE_CHANGE_EVENT = "_storage" as const;

interface StorageAdapter {
  save(key: string, value: object | null): void;
  load(key: string): object | null;
  clear(key: string): void;
  onChange(key: string, callback: (data: object | null) => void): void;
}

const localStorageAdapter: StorageAdapter = {
  save: (key: string, value: object | null) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));

      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_CHANGE_EVENT, {
          detail: { key, value },
        })
      );
    } catch (error) {
      console.error("[useStorageSync] Failed to save to localStorage:", error);
    }
  },
  load: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("[useStorageSync] Failed to load from localStorage:", error);
      return null;
    }
  },
  clear: (key: string) => {
    try {
      localStorage.removeItem(key);

      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_CHANGE_EVENT, {
          detail: { key, value: null },
        })
      );
    } catch (error) {
      console.error("[useStorageSync] Failed to clear localStorage:", error);
    }
  },
  onChange: (key: string, callback: (data: object | null) => void) => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch (error) {
          console.error("[useStorageSync] Failed to parse storage event data:", error);
        }
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        callback(e.detail.value);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        LOCAL_STORAGE_CHANGE_EVENT,
        handleCustomStorageChange as EventListener
      );
    };
  },
};

export const useStorageSync = <T>(
  syncKey: string,
  defaultValue?: { [K in keyof T]: T[K] extends JsonValue ? T[K] : never },
  configParam?: {
    overwrite?: boolean;
    storage?: StorageAdapter;
  }
) => {
  const config = {
    overwrite: false,
    defaultValue: defaultValue ?? null,
    storage: localStorageAdapter,
    ...configParam,
  };

  // useStateの代わりにuseRefを使用（再レンダリングを防ぐ）
  const dataRef = useRef<T>(
    (() => {
      const loaded = config.overwrite
        ? config.defaultValue
        : (config.storage.load(syncKey) ?? config.defaultValue);
      return loaded as T;
    })()
  );

  const listenersRef = useRef<Set<(data: T) => void>>(new Set());

  const onChange = useCallback((callback: (data: T) => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const notifyListeners = useCallback((data: T) => {
    for (const listener of listenersRef.current) {
      listener(data);
    }
  }, []);

  // 外部からの変更を監視（refを更新するが、再レンダリングは発生しない）
  useEffect(() => {
    return config.storage.onChange(syncKey, (newData: object | null) => {
      dataRef.current = newData as T;
      notifyListeners(newData as T);
    });
  }, [config.storage, syncKey, notifyListeners]);

  const setData = useCallback(
    (newData: T) => {
      dataRef.current = newData;
      config.storage.save(syncKey, newData as object | null);
      // onChange function called by custom event
    },
    [syncKey, config.storage]
  );

  const clearData = useCallback(() => {
    dataRef.current = config.defaultValue as T;
    config.storage.clear(syncKey);
    notifyListeners(config.defaultValue as T);
  }, [syncKey, config.storage, config.defaultValue, notifyListeners]);

  return {
    dataRef,
    setData,
    clearData,
    onChange,
  };
};
