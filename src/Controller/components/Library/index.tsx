import { useControllerAPIContext } from "@/Controller/contexts/ControllerAPIContext";
import { useCallback } from "react";
import styles from "./Library.module.css";
import VideoList from "./components/VideoList";
import { YouTubeDataProvider } from "./contexts/YouTubeDataContext";
import { useLibraryAPI } from "./hooks/useLibraryAPI";

const Library = () => {
  const { setLibraryAPI, mixerAPI } = useControllerAPIContext();

  // useLibraryAPIから履歴データを取得（useStorageSyncの重複を避ける）
  const { videos, selectedVideoIndex, focusTo } = useLibraryAPI({
    setGlobalLibrary: setLibraryAPI,
  });

  const handleSelect = useCallback(
    (id: string, index: number) => {
      mixerAPI?.setPreparedVideoId(id);
      focusTo(index);
    },
    [mixerAPI, focusTo]
  );

  return (
    <YouTubeDataProvider>
      <div className={styles.library}>
        <div className={styles.playlist}>
          <ul>
            <li className={styles.focused}>History</li>
          </ul>
        </div>
        <VideoList videos={videos} selectedIndex={selectedVideoIndex} onSelect={handleSelect} />
      </div>
    </YouTubeDataProvider>
  );
};

export default Library;
