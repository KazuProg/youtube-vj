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

export const useStorageSync = <T extends JsonValue = JsonValue>(
  syncKey: string,
  onChange?: ((data: T | null) => void) | null,
  configParam?: {
    overwrite?: boolean;
    defaultValue?: T | null;
    storage?: StorageAdapter;
  }
) => {
  const config = {
    overwrite: false,
    defaultValue: null,
    storage: localStorageAdapter,
    ...configParam,
  };

  // useStateの代わりにuseRefを使用（再レンダリングを防ぐ）
  const dataRef = useRef<T | null>(
    (() => {
      const loaded = config.overwrite
        ? config.defaultValue
        : (config.storage.load(syncKey) ?? config.defaultValue);
      return loaded as T | null;
    })()
  );

  // onChangeをrefで保持（依存配列から除外してイベントリスナーの再登録を防ぐ）
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 外部からの変更を監視（refを更新するが、再レンダリングは発生しない）
  useEffect(() => {
    return config.storage.onChange(syncKey, (newData: object | null) => {
      dataRef.current = newData as T | null;
      onChangeRef.current?.(newData as T | null);
    });
  }, [config.storage, syncKey]);

  const setData = useCallback(
    (newData: T | null) => {
      dataRef.current = newData;
      config.storage.save(syncKey, newData as object | null);
      // onChange function called by custom event
    },
    [syncKey, config.storage]
  );

  const clearData = useCallback(() => {
    dataRef.current = null;
    config.storage.clear(syncKey);
    onChangeRef.current?.(null);
  }, [syncKey, config.storage]);

  return {
    dataRef,
    setData,
    clearData,
  };
};
