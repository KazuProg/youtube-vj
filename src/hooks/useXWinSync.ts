import type { JsonValue } from "@/types/common";
import { useEffect, useRef, useState } from "react";

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
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  },
};

export const useXWinSync = <T extends JsonValue = JsonValue>(
  syncKey: string,
  storage: StorageAdapter = localStorageAdapter
) => {
  const [data, setData] = useState<T | null>(() => {
    const loaded = storage.load(syncKey);
    return loaded as T | null;
  });

  // 外部からの変更を監視（他のタブからの変更など）
  useEffect(() => {
    return storage.onChange(syncKey, (newData: object | null) => {
      setData(newData as T);
    });
  }, [storage, syncKey]);

  // データが変更された時のみストレージに保存（無限ループを防ぐ）
  const prevDataRef = useRef<T | null>(data);
  useEffect(() => {
    if (prevDataRef.current !== data) {
      storage.save(syncKey, data as object | null);
      prevDataRef.current = data;
    }
  }, [data, storage, syncKey]);

  return {
    data,
    setData,
    clearData: () => {
      setData(null);
      storage.clear(syncKey);
    },
  };
};
