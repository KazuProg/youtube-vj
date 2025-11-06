import { loadYouTubeIFrameAPI } from "@/components/VJPlayer/components/YouTubePlayer/utils";
import { useCallback, useRef } from "react";
import { useIndexedDBStore } from "use-indexeddb";
import fetchYouTubeTitle from "./utils";

interface UseYouTubeTitleFetchReturn {
  fetchTitle: (id: string) => Promise<string>;
  addManually: (id: string, title: string) => void;
}

interface YouTubeTitleData {
  videoId: string;
  title: string;
}

export const useYouTubeTitleFetch = (): UseYouTubeTitleFetchReturn => {
  const indexedDBStore = useIndexedDBStore<YouTubeTitleData>("YouTubeTitle");

  const pendingRef = useRef<Map<string, Promise<string>>>(new Map());

  // IndexedDB からタイトルを取得
  const getTitleFromIndexedDB = useCallback(
    async (id: string): Promise<string | null> => {
      try {
        const data = await indexedDBStore.getByID(id);
        if (data && typeof data === "object" && "title" in data) {
          return (data as YouTubeTitleData).title;
        }
        return null;
      } catch (error) {
        console.error("[useYouTubeTitleFetch] Failed to get from IndexedDB:", error);
        return null;
      }
    },
    [indexedDBStore]
  );

  // IndexedDB にタイトルを保存
  const saveTitleToIndexedDB = useCallback(
    async (id: string, title: string): Promise<void> => {
      try {
        const data: YouTubeTitleData = {
          videoId: id,
          title,
        };
        await indexedDBStore.update(data);
      } catch (error) {
        console.error("[useYouTubeTitleFetch] Failed to save to IndexedDB:", error);
      }
    },
    [indexedDBStore]
  );

  // タイトル取得関数
  const fetchTitle = useCallback(
    async (id: string): Promise<string> => {
      // 既に取得中の場合は同じPromiseを返す
      const pending = pendingRef.current.get(id);
      if (pending) {
        return pending;
      }

      // IndexedDB から取得を試みる Promise を作成
      const indexedDBPromise = (async (): Promise<string> => {
        const indexedDBTitle = await getTitleFromIndexedDB(id);
        if (indexedDBTitle) {
          return indexedDBTitle;
        }

        // IndexedDB になかった場合は YouTube API から取得
        await loadYouTubeIFrameAPI();
        const title = await fetchYouTubeTitle(id);
        // IndexedDB に保存
        await saveTitleToIndexedDB(id, title);
        return title;
      })();

      // pending に設定
      pendingRef.current.set(id, indexedDBPromise);

      // 完了時に pending から削除
      indexedDBPromise
        .catch((error) => {
          throw error;
        })
        .finally(() => {
          pendingRef.current.delete(id);
        });

      return indexedDBPromise;
    },
    [getTitleFromIndexedDB, saveTitleToIndexedDB]
  );

  // 手動でタイトルを追加
  const addManually = useCallback(
    (id: string, title: string) => {
      // IndexedDB に保存
      saveTitleToIndexedDB(id, title);
    },
    [saveTitleToIndexedDB]
  );

  return { fetchTitle, addManually };
};

export default useYouTubeTitleFetch;
