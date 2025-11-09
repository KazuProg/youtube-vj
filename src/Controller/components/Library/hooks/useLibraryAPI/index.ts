import { clamp } from "@/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LibraryAPI, VideoItem } from "../../types";
import { useHistory } from "../usehistory";

interface UseLibraryAPIParams {
  setGlobalLibrary: (library: LibraryAPI | null) => void;
}

interface UseLibraryAPIReturn {
  videos: VideoItem[];
  selectedVideoIndex: number;
  focusTo: (absoluteIndex: number) => void;
}

export const useLibraryAPI = ({ setGlobalLibrary }: UseLibraryAPIParams): UseLibraryAPIReturn => {
  const { history, addHistory, removeHistory, clearHistory } = useHistory();
  // LocalStorageから再生履歴を読み取り
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
          addHistory(videoId, title);
        },
        remove: (index: number) => {
          removeHistory(index);
        },
        clear: () => {
          clearHistory();
        },
        get: () => {
          return history;
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
  }, [history, addHistory, removeHistory, clearHistory, setGlobalLibrary, focusTo, focusBy]);

  return {
    videos: [...history].reverse(),
    selectedVideoIndex,
    focusTo,
  };
};
