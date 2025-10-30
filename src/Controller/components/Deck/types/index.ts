export interface DeckRef {
  playVideo: () => void;
  pauseVideo: () => void;
  isPlaying: () => boolean;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number | null;
  loadVideoById: (videoId: string) => void;
  getDuration: () => number | null;
  playerState: number;
  playbackRate: number;
}
