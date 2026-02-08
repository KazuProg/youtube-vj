import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { useCallback } from "react";

interface UseHistoryReturn {
  getHistory: () => string[];
  addHistory: (videoId: string) => void;
  removeHistory: (index: number) => void;
  clearHistory: () => void;
  onChange: (callback: (history: string[]) => void) => () => void;
}

export const useHistory = (): UseHistoryReturn => {
  const {
    dataRef: historyRef,
    setData: setHistory,
    onChange,
  } = useStorageSync<string[]>(LOCAL_STORAGE_KEY.history, { defaultValue: [] });

  const getHistory = useCallback(() => {
    return historyRef.current ?? [];
  }, [historyRef]);

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
    [setHistory, historyRef]
  );

  const removeHistory = useCallback(
    (index: number) => {
      const prevItems = historyRef.current ?? [];
      setHistory(prevItems.filter((_, i) => i !== index));
    },
    [setHistory, historyRef]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return {
    getHistory,
    addHistory,
    removeHistory,
    clearHistory,
    onChange,
  };
};
