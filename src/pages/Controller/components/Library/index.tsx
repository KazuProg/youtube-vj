import { useFileIO } from "@/hooks/useFileIO";
import { useControllerAPIContext } from "@/pages/Controller/contexts/ControllerAPIContext";
import type { VideoItem } from "@/pages/Controller/types/videoItem";
import { isYouTubeVideoId, isYouTubeVideoInfo, urlParser } from "@/pages/Controller/utils/youtube";
import { useCallback, useState } from "react";
import styles from "./Library.module.css";
import FileDropZone from "./components/FileDropZone";
import VideoList from "./components/VideoList";
import { YouTubeDataProvider } from "./contexts/YouTubeDataContext";
import { useLibraryAPI } from "./hooks/useLibraryAPI";

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
    searchYouTube,
  } = useLibraryAPI({
    setGlobalLibrary: setLibraryAPI,
  });
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ファイル読み込み処理を共通化
  const handleFileLoad = useCallback(
    (text: string, filename?: string) => {
      const filenameWithoutExt = filename?.replace(/\.[^/.]+$/, "") ?? "";
      if (!libraryAPI) {
        return;
      }

      const videoItems: VideoItem[] = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line): VideoItem[] => {
          if (isYouTubeVideoId(line)) {
            return [{ id: line }];
          }
          const info = urlParser.parse(line);
          if (isYouTubeVideoInfo(info)) {
            return [{ id: info.id, start: info.params?.start }];
          }
          return [];
        });
      addPlaylist(filenameWithoutExt, videoItems, true);
    },
    [libraryAPI, addPlaylist]
  );

  const { importFile } = useFileIO<string>({
    accept: ".txt",
    parse: (t) => t,
  });

  const handleLoadClick = useCallback(async () => {
    const result = await importFile();
    if (result) {
      handleFileLoad(result.data, result.filename);
    }
  }, [importFile, handleFileLoad]);

  const handleSelectPlaylist = useCallback(
    (index: number) => {
      changePlaylistFocus(index);
    },
    [changePlaylistFocus]
  );

  const handleSelectVideo = useCallback(
    (videoItem: VideoItem, index: number) => {
      mixerAPI?.setPreparedVideo(videoItem);
      changeVideoFocus(index);
    },
    [mixerAPI, changeVideoFocus]
  );

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      searchYouTube(searchQuery);
    }
  }, [searchQuery, searchYouTube]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (!e.nativeEvent.isComposing) {
          e.preventDefault();
          handleSearchSubmit();
        }
      }
    },
    [handleSearchSubmit]
  );

  return (
    <YouTubeDataProvider>
      <FileDropZone accept=".txt" onFileLoad={handleFileLoad} className={styles.library}>
        <div className={styles.playlist}>
          <button type="button" onClick={handleLoadClick}>
            Load Playlist
          </button>
          <ul>
            {Array.from(playlists.keys()).map((name, index) => (
              <li
                key={name}
                title={name}
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
        {Array.from(playlists.keys())[selectedPlaylistIndex] === "Search" && (
          <input
            className={styles.search}
            type="text"
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            onKeyDown={handleSearchKeyDown}
            value={searchQuery}
            placeholder="検索..."
          />
        )}
      </FileDropZone>
    </YouTubeDataProvider>
  );
};

export default Library;
