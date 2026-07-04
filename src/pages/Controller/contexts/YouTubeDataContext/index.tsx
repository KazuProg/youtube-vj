import { createContext, useContext, useEffect } from "react";
import setupIndexedDB from "use-indexeddb";
import { dbConfig } from "./dbConfig";
import { useTitleCache } from "./hooks/useTitleCache";
import useYouTubeTitleFetch from "./hooks/useYouTubeTitleFetch";

interface YouTubeDataContextValue {
  fetchTitle: (id: string) => Promise<string>;
  titleCacheCount: number | null;
  refreshTitleCacheCount: () => Promise<void>;
  clearTitleCache: () => Promise<void>;
}

const YouTubeDataContext = createContext<YouTubeDataContextValue | null>(null);

interface YouTubeDataProviderProps {
  children: React.ReactNode;
}

export const YouTubeDataProvider = ({ children }: YouTubeDataProviderProps) => {
  useEffect(() => {
    setupIndexedDB(dbConfig);
  }, []);

  const { fetchTitle } = useYouTubeTitleFetch();
  const { count, refresh, clear } = useTitleCache();

  return (
    <YouTubeDataContext.Provider
      value={{
        fetchTitle,
        titleCacheCount: count,
        refreshTitleCacheCount: refresh,
        clearTitleCache: clear,
      }}
    >
      {children}
    </YouTubeDataContext.Provider>
  );
};

export const useYouTubeDataContext = () => {
  const context = useContext(YouTubeDataContext);
  if (!context) {
    throw new Error("useYouTubeDataContext must be used within YouTubeDataProvider");
  }
  return context;
};
