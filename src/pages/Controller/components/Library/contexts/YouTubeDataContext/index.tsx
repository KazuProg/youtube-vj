import { createContext, useContext, useEffect } from "react";
import setupIndexedDB from "use-indexeddb";
import { dbConfig } from "./dbConfig";
import useYouTubeTitleFetch from "./hooks/useYouTubeTitleFetch";

interface YouTubeDataContextValue {
  fetchTitle: (id: string) => Promise<string>;
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

  return (
    <YouTubeDataContext.Provider
      value={{
        fetchTitle,
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
