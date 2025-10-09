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

export const useStorageSync = <T extends JsonValue = JsonValue>(
  syncKey: string,
  storage: StorageAdapter = localStorageAdapter
) => {
  const [data, setData] = useState<T | null>(() => {
    const loaded = storage.load(syncKey);
    return loaded as T | null;
  });
  const isExternalChangeRef = useRef(false);

  useEffect(() => {
    return storage.onChange(syncKey, (newData: object | null) => {
      isExternalChangeRef.current = true;
      setData(newData as T);
    });
  }, [storage, syncKey]);

  useEffect(() => {
    if (!isExternalChangeRef.current) {
      storage.save(syncKey, data as object | null);
    }
    isExternalChangeRef.current = false;
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
