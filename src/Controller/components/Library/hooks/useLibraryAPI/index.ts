import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { clamp } from "@/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LibraryAPI, VideoItem } from "../../types";

interface UseLibraryAPIParams {
  setGlobalLibrary: (library: LibraryAPI | null) => void;
}

interface UseLibraryAPIReturn {
  videos: VideoItem[];
  selectedVideoIndex: number;
  focusTo: (absoluteIndex: number) => void;
}

export const useLibraryAPI = ({ setGlobalLibrary }: UseLibraryAPIParams): UseLibraryAPIReturn => {
  // LocalStorageから再生履歴を読み取り
  const { data: history, setData: setHistory } = useStorageSync<VideoItem[]>(
    LOCAL_STORAGE_KEY.history,
    {
      defaultValue: [],
    }
  );

  const libraryAPIRef = useRef<LibraryAPI | null>(null);

  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0);

  const focusTo = useCallback(
    (absoluteIndex: number) => {
      const maxIndex = (history?.length ?? 0) - 1;
      setSelectedVideoIndex(clamp(absoluteIndex, 0, maxIndex));
    },
    [history]
  );

  const focusBy = useCallback(
    (relativeIndex: number) => {
      setSelectedVideoIndex((prevIndex) => {
        const index = prevIndex + relativeIndex;
        const maxIndex = (history?.length ?? 0) - 1;
        return clamp(index, 0, maxIndex);
      });
    },
    [history]
  );

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
            const newItem: VideoItem = { id: videoId, title };
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
          return history ?? [];
        },
      },
      navigation: {
        selectNext: () => {
          focusBy(1);
        },
        selectPrev: () => {
          focusBy(-1);
        },
        selectFirst: () => {
          focusTo(0);
        },
        selectLast: () => {
          focusTo((history?.length ?? 0) - 1);
        },
        selectTo: (index: number) => {
          focusTo(index);
        },
      },
    } as LibraryAPI;
    setGlobalLibrary(libraryAPIRef.current);
  }, [setHistory, setGlobalLibrary, focusTo, focusBy, history]);

  return {
    videos: [...(history ?? [])].reverse(),
    selectedVideoIndex,
    focusTo,
  };
};
