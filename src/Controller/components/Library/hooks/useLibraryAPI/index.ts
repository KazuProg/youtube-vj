import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HistoryItem, LibraryAPI } from "../../types";

interface UseLibraryAPIParams {
  setGlobalLibrary: (library: LibraryAPI | null) => void;
}

interface UseLibraryAPIReturn {
  history: HistoryItem[];
  selectedIndex: number;
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

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const selectedIndexRef = useRef<number>(0);

  useEffect(() => {
    historyRef.current = history ?? [];
  }, [history]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const focusTo = useCallback((index: number) => {
    const maxIndex = historyRef.current?.length - 1;
    // 範囲チェック
    if (index < 0) {
      setSelectedIndex(0);
    } else if (index > maxIndex) {
      setSelectedIndex(maxIndex);
    } else {
      setSelectedIndex(index);
    }
  }, []);

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
      navigation: {
        selectNext: () => {
          focusTo(selectedIndexRef.current + 1);
        },
        selectPrev: () => {
          focusTo(selectedIndexRef.current - 1);
        },
        selectFirst: () => {
          focusTo(0);
        },
        selectLast: () => {
          focusTo(historyRef.current?.length - 1);
        },
        selectTo: (index: number) => {
          focusTo(index);
        },
      },
    } as LibraryAPI;
    setGlobalLibrary(libraryAPIRef.current);
  }, [setHistory, setGlobalLibrary, focusTo]);

  return { history: history ?? [], selectedIndex };
};
