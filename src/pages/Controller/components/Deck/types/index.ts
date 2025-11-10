export interface DeckAPI {
  playVideo: () => void;
  pauseVideo: () => void;
  isPlaying: () => boolean;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setHotCue: (cueId: number, time?: number) => void;
  jumpToHotCue: (cueId: number) => void;
  deleteHotCue: (cueId: number) => void;
  hasHotCue: (cueId: number) => boolean;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number | null;
  loadVideoById: (videoId: string) => void;
  getDuration: () => number | null;
}
