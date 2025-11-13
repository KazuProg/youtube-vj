import { useTextFileReader } from "@/hooks/useTextFileReader";
import { useControllerAPIContext } from "@/pages/Controller/contexts/ControllerAPIContext";
import { parseYouTubeURL } from "@/pages/Controller/utils";
import { useCallback, useState } from "react";
import styles from "./Library.module.css";
import VideoList from "./components/VideoList";
import { YouTubeDataProvider } from "./contexts/YouTubeDataContext";
import { useLibraryAPI } from "./hooks/useLibraryAPI";
import type { VideoItem } from "./types";

const Library = () => {
  const { libraryAPI, setLibraryAPI, mixerAPI } = useControllerAPIContext();
  const [isDragging, setIsDragging] = useState(false);

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

  // ドラッグアンドドロップのイベントハンドラー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 子要素への移動を考慮（relatedTarget が現在の要素の子要素でない場合のみ非表示）
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const textFile = files.find(
        (file) => file.type === "text/plain" || file.name.endsWith(".txt")
      );

      if (!textFile) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleFileLoad(text, textFile.name);
        }
      };
      reader.onerror = () => {
        console.error("Failed to read file");
      };
      reader.readAsText(textFile);
    },
    [handleFileLoad]
  );

  return (
    <YouTubeDataProvider>
      <div
        className={`${styles.library} ${isDragging ? styles.dragging : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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
        {isDragging && <div className={styles.dragOverlay}>+</div>}
      </div>
    </YouTubeDataProvider>
  );
};

export default Library;
