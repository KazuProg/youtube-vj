import useYouTubeTitleFetch from "@/Controller/components/Library/hooks/useYouTubeTitleFetch";
import { createContext, useContext } from "react";

interface YouTubeDataContextValue {
  fetchTitle: (id: string) => Promise<string>;
}

const YouTubeDataContext = createContext<YouTubeDataContextValue | null>(null);

export const YouTubeDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { fetchYouTubeTitle } = useYouTubeTitleFetch();

  return (
    <YouTubeDataContext.Provider
      value={{
        fetchTitle: fetchYouTubeTitle,
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
