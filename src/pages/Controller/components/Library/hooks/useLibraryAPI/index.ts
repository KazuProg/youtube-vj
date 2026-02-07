import { useControllerAPIContext } from "@/pages/Controller/contexts/ControllerAPIContext";
import type { VideoItem } from "@/pages/Controller/types/videoItem";
import { clamp } from "@/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LibraryAPI } from "../../types";

interface UseLibraryAPIParams {
  setGlobalLibrary: (library: LibraryAPI | null) => void;
}

interface UseLibraryAPIReturn {
  playlists: Map<string, VideoItem[]>;
  selectedPlaylistIndex: number;

  videos: VideoItem[];
  selectedVideoIndex: number;

  addPlaylist: (name: string, videoIds: VideoItem[], changeFocus?: boolean) => void;
  changePlaylistFocus: (index: number, isRelative?: boolean) => void;
  changeVideoFocus: (index: number, isRelative?: boolean) => void;

  searchYouTube: (query: string) => void;
}

type FocusType = "playlist" | "video";

export const useLibraryAPI = ({ setGlobalLibrary }: UseLibraryAPIParams): UseLibraryAPIReturn => {
  const { settings, historyAPI } = useControllerAPIContext();

  const handleHistoryChange = useCallback(() => {
    const history = historyAPI.get();
    setPlaylists((prev) => {
      const newMap = new Map(prev);
      newMap.set(
        "History",
        history.map((videoId) => ({ id: videoId }))
      );
      return newMap;
    });
  }, [historyAPI]);

  useEffect(() => {
    handleHistoryChange();
  }, [handleHistoryChange]);

  const [playlists, setPlaylists] = useState<Map<string, VideoItem[]>>(() => {
    const initialHistory = historyAPI.get();
    const initialPlaylists = new Map([
      ["History", initialHistory.map((videoId) => ({ id: videoId }))],
    ]);
    if (settings.youtubeDataAPIKey) {
      initialPlaylists.set("Search", []);
    }
    return initialPlaylists;
  });

  const [selectedPlaylistIndex, setSelectedPlaylistIndex] = useState<number>(0);
  const [videos, setVideos] = useState<VideoItem[]>(playlists.get("History") || []);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0);

  const pendingFocusPlaylistName = useRef<string | null>(null);
  const [focusedType, setFocusedType] = useState<FocusType>("video");

  useEffect(() => {
    if (pendingFocusPlaylistName.current) {
      const playlistNames = Array.from(playlists.keys());
      const index = playlistNames.indexOf(pendingFocusPlaylistName.current);
      if (index !== -1) {
        setSelectedVideoIndex(0);
        setSelectedPlaylistIndex(index);
        pendingFocusPlaylistName.current = null;
      }
    }
  }, [playlists]);

  useEffect(() => {
    setVideos(() => {
      const playlistName = Array.from(playlists.keys())[selectedPlaylistIndex];
      const _videos = playlists.get(playlistName) ?? [];
      if (playlistName === "History") {
        return [..._videos].reverse();
      }
      return _videos;
    });
  }, [playlists, selectedPlaylistIndex]);

  useEffect(() => {
    setPlaylists((prev) => {
      const newMap = new Map(prev);
      const hasSearch = newMap.has("Search");
      const hasApiKey = !!settings.youtubeDataAPIKey;

      if (hasApiKey && !hasSearch) {
        newMap.set("Search", []);
      } else if (!hasApiKey && hasSearch) {
        const prevPlaylistNames = Array.from(prev.keys());
        const searchIndex = prevPlaylistNames.indexOf("Search");
        if (searchIndex !== -1 && selectedPlaylistIndex === searchIndex) {
          setSelectedPlaylistIndex(0);
        }
        newMap.delete("Search");
      }
      return newMap;
    });
  }, [settings.youtubeDataAPIKey, selectedPlaylistIndex]);

  const addPlaylist = useCallback((name: string, videos: VideoItem[], changeFocus = false) => {
    if (name === "History" || name === "Search") {
      console.error(`${name} is not allowed to be added. It is a system-managed playlist.`);
      return;
    }

    if (changeFocus) {
      pendingFocusPlaylistName.current = name;
    }

    setPlaylists((prev) => {
      const newMap = new Map(prev);
      newMap.set(name, videos);
      return newMap;
    });
  }, []);

  const changePlaylistFocus = useCallback(
    (index: number, isRelative = false) => {
      setSelectedVideoIndex(0);
      setSelectedPlaylistIndex((prevIndex) => {
        const maxIndex = playlists.size - 1;
        const newIndex = isRelative ? prevIndex + index : index;
        return clamp(newIndex, 0, maxIndex);
      });
    },
    [playlists]
  );

  const changeVideoFocus = useCallback(
    (index: number, isRelative = false) => {
      setSelectedVideoIndex((prevIndex) => {
        const maxIndex = (videos?.length ?? 0) - 1;
        const newIndex = isRelative ? prevIndex + index : index;
        return clamp(newIndex, 0, maxIndex);
      });
    },
    [videos]
  );

  useEffect(() => {
    const libraryAPI: LibraryAPI = {
      history: {
        add: (videoId: string) => {
          historyAPI.add(videoId);
          handleHistoryChange();
        },
        remove: (index: number) => {
          historyAPI.remove(index);
          handleHistoryChange();
        },
        clear: () => {
          historyAPI.clear();
          handleHistoryChange();
        },
        get: () => {
          return playlists.get("History") ?? [];
        },
      },
      playlists: {
        add: (name: string, videoIds: VideoItem[]) => {
          addPlaylist(name, videoIds);
        },
        remove: (name: string) => {
          if (name === "History" || name === "Search") {
            console.error(`${name} is not allowed to be removed. It is a system-managed playlist.`);
            return;
          }
          setPlaylists((prev) => {
            const newMap = new Map(prev);
            newMap.delete(name);
            return newMap;
          });
        },
        get: (name: string) => {
          return playlists.get(name) ?? [];
        },
        getAllNames: () => {
          return Array.from(playlists.keys());
        },
      },
      navigation: {
        // Playlist navigation
        selectNextPlaylist: () => {
          changePlaylistFocus(1, true);
        },
        selectPrevPlaylist: () => {
          changePlaylistFocus(-1, true);
        },
        selectPlaylistTo: (absoluteIndex: number) => {
          changePlaylistFocus(absoluteIndex, false);
        },

        // Video navigation
        selectNextVideo: () => {
          changeVideoFocus(1, true);
        },
        selectPrevVideo: () => {
          changeVideoFocus(-1, true);
        },
        selectVideoTo: (absoluteIndex: number) => {
          changeVideoFocus(absoluteIndex, false);
        },

        // Common navigation
        selectNext: () => {
          if (focusedType === "video") {
            libraryAPI.navigation.selectNextVideo();
          } else {
            libraryAPI.navigation.selectNextPlaylist();
          }
        },
        selectPrev: () => {
          if (focusedType === "video") {
            libraryAPI.navigation.selectPrevVideo();
          } else {
            libraryAPI.navigation.selectPrevPlaylist();
          }
        },
        selectTo: (absoluteIndex: number) => {
          if (focusedType === "video") {
            libraryAPI.navigation.selectVideoTo(absoluteIndex);
          } else {
            libraryAPI.navigation.selectPlaylistTo(absoluteIndex);
          }
        },

        // Focus change
        changeFocus: () => {
          setFocusedType((prevType) => {
            return prevType === "playlist" ? "video" : "playlist";
          });
        },
      },
    } as LibraryAPI;
    setGlobalLibrary(libraryAPI);
  }, [
    historyAPI,
    handleHistoryChange,

    playlists,
    addPlaylist,

    changePlaylistFocus,
    changeVideoFocus,
    focusedType,

    setGlobalLibrary,
  ]);

  const searchYouTube = useCallback(
    async (query: string) => {
      const apiKey = settings.youtubeDataAPIKey;
      if (!apiKey) {
        console.warn("YouTube API key is not set. Please configure it in settings.");
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&q=${query}&type=video&maxResults=50`
      );
      const data = await response.json();
      const videos = data.items.map(
        (item: { id: { videoId: string }; snippet: { title: string } }) => ({
          id: item.id.videoId,
          title: item.snippet.title,
        })
      );
      setPlaylists((prev) => {
        const newMap = new Map(prev);
        newMap.set("Search", videos);
        return newMap;
      });
    },
    [settings]
  );

  return {
    playlists,
    selectedPlaylistIndex,

    videos,
    selectedVideoIndex,

    addPlaylist,
    changePlaylistFocus,
    changeVideoFocus,

    searchYouTube,
  };
};
