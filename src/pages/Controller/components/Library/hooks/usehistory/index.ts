import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { useCallback } from "react";
import type { VideoItem } from "../../types";

interface UseHistoryReturn {
  history: VideoItem[];
  addHistory: (videoId: string, title: string) => void;
  removeHistory: (index: number) => void;
  clearHistory: () => void;
}

export const useHistory = (): UseHistoryReturn => {
  // LocalStorageから再生履歴を読み取り
  const { dataRef: historyRef, setData: setHistory } = useStorageSync<VideoItem[]>(
    LOCAL_STORAGE_KEY.history,
    null,
    {
      defaultValue: [],
    }
  );

  const addHistory = useCallback(
    (videoId: string, title: string) => {
      const prevItems = historyRef.current ?? [];
      // 直近（最後）のIDと同じだったら追加しない
      const lastItem = prevItems[prevItems.length - 1];
      if (lastItem?.id === videoId) {
        return;
      }
      // 新しいアイテムを後ろに追加（時系列順に保持）
      const newItem: VideoItem = { id: videoId, title };
      setHistory([...prevItems, newItem]);
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
    history: historyRef.current ?? [],
    addHistory,
    removeHistory,
    clearHistory,
  };
};
