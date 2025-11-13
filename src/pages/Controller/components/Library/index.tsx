import { useTextFileReader } from "@/hooks/useTextFileReader";
import { useControllerAPIContext } from "@/pages/Controller/contexts/ControllerAPIContext";
import { parseYouTubeURL } from "@/pages/Controller/utils";
import { useCallback } from "react";
import styles from "./Library.module.css";
import FileDropZone from "./components/FileDropZone";
import VideoList from "./components/VideoList";
import { YouTubeDataProvider } from "./contexts/YouTubeDataContext";
import { useLibraryAPI } from "./hooks/useLibraryAPI";
import type { VideoItem } from "./types";

const Library = () => {
  const { libraryAPI, setLibraryAPI, mixerAPI } = useControllerAPIContext();

  // useLibraryAPIから履歴データを取得（useStorageSyncの重複を避ける）
  const {
    playlists,
    selectedPlaylistIndex,
    videos,
    selectedVideoIndex,
    addPlaylist,
    changePlaylistFocus,
    changeVideoFocus,
  } = useLibraryAPI({
    setGlobalLibrary: setLibraryAPI,
  });

  // ファイル読み込み処理を共通化
  const handleFileLoad = useCallback(
    (text: string, filename?: string) => {
      const filenameWithoutExt = filename?.replace(/\.[^/.]+$/, "") ?? "";
      if (!libraryAPI) {
        return;
      }

      // 各行を解析して YouTube ID を抽出
      const items = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => parseYouTubeURL(line)?.id)
        .filter((id): id is string => id !== undefined);
      const videoItems: VideoItem[] = items.map((id) => ({ id, title: "" }));
      addPlaylist(filenameWithoutExt, videoItems, true);
    },
    [libraryAPI, addPlaylist]
  );

  const { openFileDialog } = useTextFileReader({
    accept: ".txt",
    onLoad: handleFileLoad,
  });

  const handleSelectPlaylist = useCallback(
    (index: number) => {
      changePlaylistFocus(index);
    },
    [changePlaylistFocus]
  );

  const handleSelectVideo = useCallback(
    (id: string, index: number) => {
      mixerAPI?.setPreparedVideoId(id);
      changeVideoFocus(index);
    },
    [mixerAPI, changeVideoFocus]
  );

  return (
    <YouTubeDataProvider>
      <FileDropZone accept=".txt" onFileLoad={handleFileLoad} className={styles.library}>
        <div className={styles.playlist}>
          <button type="button" onClick={openFileDialog}>
            Load Playlist
          </button>
          <ul>
            {Array.from(playlists.keys()).map((name, index) => (
              <li
                key={name}
                onClick={() => handleSelectPlaylist(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectPlaylist(index);
                  }
                }}
                className={selectedPlaylistIndex === index ? styles.focused : ""}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
        <VideoList
          videos={videos}
          selectedIndex={selectedVideoIndex}
          onSelect={handleSelectVideo}
        />
      </FileDropZone>
    </YouTubeDataProvider>
  );
};

export default Library;
