import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { useEffect, useRef } from "react";
import type { HistoryItem, LibraryAPI } from "../../types";

interface UseLibraryAPIParams {
  setGlobalLibrary: (library: LibraryAPI | null) => void;
}

interface UseLibraryAPIReturn {
  history: HistoryItem[];
}

export const useLibraryAPI = ({ setGlobalLibrary }: UseLibraryAPIParams): UseLibraryAPIReturn => {
  // LocalStorageから再生履歴を読み取り
  const { data: history, setData: setHistory } = useStorageSync<HistoryItem[]>(
    LOCAL_STORAGE_KEY.history,
    {
      defaultValue: [],
    }
  );

  const libraryAPIRef = useRef<LibraryAPI | null>(null);
  const historyRef = useRef<HistoryItem[]>(history ?? []);

  useEffect(() => {
    historyRef.current = history ?? [];
  }, [history]);

  useEffect(() => {
    libraryAPIRef.current = {
      history: {
        add: (videoId: string, title: string) => {
          setHistory((prev) => {
            const currentItems = prev ?? [];
            // 直近（最後）のIDと同じだったら追加しない
            const lastItem = currentItems[currentItems.length - 1];
            if (lastItem?.id === videoId) {
              return currentItems;
            }
            // 新しいアイテムを後ろに追加（時系列順に保持）
            const newItem: HistoryItem = { id: videoId, title };
            return [...currentItems, newItem];
          });
        },
        remove: (index: number) => {
          setHistory((prev) => {
            const currentItems = prev ?? [];
            // インデックスの範囲チェック
            if (index < 0 || index >= currentItems.length) {
              return currentItems;
            }
            // 指定されたインデックスのアイテムを削除
            return currentItems.filter((_, i) => i !== index);
          });
        },
        clear: () => {
          setHistory([]);
        },
        get: () => {
          return historyRef.current ?? [];
        },
      },
    } as LibraryAPI;
    setGlobalLibrary(libraryAPIRef.current);
  }, [setHistory, setGlobalLibrary]);

  return { history: history ?? [] };
};
