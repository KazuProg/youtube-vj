import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { useCallback, useEffect, useRef } from "react";

interface UseHistoryReturn {
  getHistory: () => string[];
  addHistory: (videoId: string) => void;
  removeHistory: (index: number) => void;
  clearHistory: () => void;
  onChange: (callback: (history: string[]) => void) => () => void;
}

export const useHistory = (): UseHistoryReturn => {
  const { data: history, setData: setHistory } = useStorageSync<string[]>(
    LOCAL_STORAGE_KEY.history,
    []
  );
  const historyRef = useRef(history);
  historyRef.current = history;

  const callbacksRef = useRef<Set<(h: string[]) => void>>(new Set());
  useEffect(() => {
    for (const callback of callbacksRef.current) {
      callback(history);
    }
  }, [history]);

  const getHistory = useCallback(() => {
    return historyRef.current ?? [];
  }, []);

  const addHistory = useCallback(
    (videoId: string) => {
      const prevItems = historyRef.current ?? [];
      // 直近（最後）のIDと同じだったら追加しない
      const lastItem = prevItems[prevItems.length - 1];
      if (lastItem === videoId) {
        return;
      }
      // 新しいアイテムを後ろに追加（時系列順に保持）
      setHistory([...prevItems, videoId]);
    },
    [setHistory]
  );

  const removeHistory = useCallback(
    (index: number) => {
      const prevItems = historyRef.current ?? [];
      setHistory(prevItems.filter((_, i) => i !== index));
    },
    [setHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const onChange = useCallback((callback: (history: string[]) => void) => {
    callbacksRef.current.add(callback);
    return () => {
      callbacksRef.current.delete(callback);
    };
  }, []);

  return {
    getHistory,
    addHistory,
    removeHistory,
    clearHistory,
    onChange,
  };
};
