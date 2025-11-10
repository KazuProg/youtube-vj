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
  const { data: history, setData: setHistory } = useStorageSync<VideoItem[]>(
    LOCAL_STORAGE_KEY.history,
    {
      defaultValue: [],
    }
  );

  const addHistory = useCallback(
    (videoId: string, title: string) => {
      setHistory((prev) => {
        const prevItems = prev ?? [];
        // 直近（最後）のIDと同じだったら追加しない
        const lastItem = prevItems[prevItems.length - 1];
        if (lastItem?.id === videoId) {
          return prevItems;
        }
        // 新しいアイテムを後ろに追加（時系列順に保持）
        const newItem: VideoItem = { id: videoId, title };
        return [...prevItems, newItem];
      });
    },
    [setHistory]
  );

  const removeHistory = useCallback(
    (index: number) => {
      setHistory((prev) => {
        const prevItems = prev ?? [];
        return prevItems.filter((_, i) => i !== index);
      });
    },
    [setHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return {
    history: history ?? [],
    addHistory,
    removeHistory,
    clearHistory,
  };
};
