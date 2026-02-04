import type { VideoItem } from "@/pages/Controller/types/videoItem";

export interface DeckAPI {
  playVideo: () => void;
  pauseVideo: () => void;
  isPlaying: () => boolean;
  seekTo: (seconds: number) => void;
  adjustTiming: (relativeTime: number) => void;
  setHotCue: (cueId: number, time?: number) => void;
  jumpToHotCue: (cueId: number) => void;
  deleteHotCue: (cueId: number) => void;
  hasHotCue: (cueId: number) => boolean;
  setLoopStart: (time?: number) => void;
  setLoopEnd: (time?: number) => void;
  clearLoop: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setFilters: (filters: Record<string, string>) => void;
  getCurrentTime: () => number | null;
  loadVideo: (video: VideoItem | string) => void;
  getDuration: () => number | null;
}
