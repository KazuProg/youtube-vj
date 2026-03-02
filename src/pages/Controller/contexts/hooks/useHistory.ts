import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { useCallback, useRef } from "react";

interface UseHistoryReturn {
  history: string[];
  addHistory: (videoId: string) => void;
  removeHistory: (index: number) => void;
  clearHistory: () => void;
}

export const useHistory = (): UseHistoryReturn => {
  const { data: history, setData: setHistory } = useStorageSync<string[]>(
    LOCAL_STORAGE_KEY.history,
    []
  );
  const historyRef = useRef(history);
  historyRef.current = history;

  const addHistory = useCallback(
    (videoId: string) => {
      const prevItems = historyRef.current ?? [];
      if (prevItems[prevItems.length - 1] === videoId) {
        return;
      }
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

  const clearHistory = useCallback(() => setHistory([]), [setHistory]);

  return {
    history,
    addHistory,
    removeHistory,
    clearHistory,
  };
};
