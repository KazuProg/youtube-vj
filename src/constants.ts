export const LOCAL_STORAGE_KEY = {
  player: "ytvj_player",
};

export const DEFAULT_VALUES = {
  videoId: "BLeUas72Mzk",
  syncKey: "vj-player-default",
  playbackRate: 1,
  volume: 100,
  seekThreshold: 1.0,
  seekDebounce: 100,
} as const;

export const INITIAL_SYNC_DATA = {
  videoId: DEFAULT_VALUES.videoId,
  playbackRate: DEFAULT_VALUES.playbackRate,
  currentTime: 0,
  baseTime: 0,
  paused: false,
} as const;
