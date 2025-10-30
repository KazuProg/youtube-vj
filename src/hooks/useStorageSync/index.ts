import type { JsonValue } from "@/types";
import { useEffect, useRef, useState } from "react";

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
      console.error("Error saving to localStorage:", error);
    }
  },
  load: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
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
      console.error("Error clearing localStorage:", error);
    }
  },
  onChange: (key: string, callback: (data: object | null) => void) => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch (error) {
          console.error("Error parsing storage event data:", error);
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
  const [data, setData] = useState<T | null>(() => {
    const loaded = config.overwrite
      ? config.defaultValue
      : (config.storage.load(syncKey) ?? config.defaultValue);
    return loaded as T | null;
  });
  const isExternalChangeRef = useRef(false);

  useEffect(() => {
    return config.storage.onChange(syncKey, (newData: object | null) => {
      isExternalChangeRef.current = true;
      setData(newData as T);
    });
  }, [config.storage, syncKey]);

  useEffect(() => {
    if (!isExternalChangeRef.current) {
      config.storage.save(syncKey, data as object | null);
    }
    isExternalChangeRef.current = false;
  }, [data, config.storage, syncKey]);

  return {
    data,
    setData,
    clearData: () => {
      setData(null);
      config.storage.clear(syncKey);
    },
  };
};
