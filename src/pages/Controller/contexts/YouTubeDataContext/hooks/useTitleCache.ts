import { useCallback, useState } from "react";
import setupIndexedDB, { useIndexedDBStore } from "use-indexeddb";
import { YOUTUBE_TITLE_STORE_NAME, dbConfig } from "../dbConfig";
import type { YouTubeTitleData } from "./useYouTubeTitleFetch";

export const useTitleCache = () => {
  const store = useIndexedDBStore<YouTubeTitleData>(YOUTUBE_TITLE_STORE_NAME);
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    await setupIndexedDB(dbConfig);
    const all = await store.getAll();
    setCount(all.length);
  }, [store]);

  const clear = useCallback(async () => {
    await setupIndexedDB(dbConfig);
    await store.deleteAll();
    await refresh();
  }, [store, refresh]);

  return { count, refresh, clear };
};
