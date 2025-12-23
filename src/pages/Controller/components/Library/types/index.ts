export type VideoItem = {
  id: string;
  title: string | null;
};

export interface LibraryAPI {
  history: {
    add: (videoId: string) => void;
    remove: (index: number) => void;
    clear: () => void;
    get: () => VideoItem[];
  };
  playlists: {
    add: (name: string, videoIds: VideoItem[]) => void;
    remove: (name: string) => void;
    get: (name: string) => VideoItem[];
    getAllNames: () => string[];
  };
  navigation: {
    // Playlist navigation
    selectNextPlaylist: () => void;
    selectPrevPlaylist: () => void;
    selectPlaylistTo: (absoluteIndex: number) => void;

    // Video navigation
    selectNextVideo: () => void;
    selectPrevVideo: () => void;
    selectVideoTo: (absoluteIndex: number) => void;

    // Common navigation
    selectNext: () => void;
    selectPrev: () => void;
    selectTo: (absoluteIndex: number) => void;

    // Focus change
    changeFocus: () => void;
  };
}
