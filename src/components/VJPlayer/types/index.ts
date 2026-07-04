/** VJPlayer / usePlayerSync / useDeckAPI が参照する唯一のプレイヤー型 */
export interface VJPlayerInterface {
  getCurrentTime: () => number | null;
  getDuration: () => number | null;
  isPlaying: () => boolean;
  setPlaybackRate: (rate: number) => boolean;
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
}

/** 子プレイヤーから VJPlayer へ通知する生の再生状態 */
export type RawPlaybackState = "pause" | "play" | "ended";

/** ソースロード・再生意図（SyncData の一部を Player に渡す） */
export type PlaybackIntent = {
  startTime: number;
  paused: boolean;
  playbackRate: number;
};

export type LoadableVideoSource =
  | { type: "youtube"; videoId: string }
  | { type: "url"; url: string };

export type VideoSource = LoadableVideoSource | { type: "none" };

export type VJSyncData = {
  source: VideoSource;
  playbackRate: number;
  currentTime: number;
  baseTime: number;
  paused: boolean;
  loopStart: number | null;
  loopEnd: number | null;
  filters: Record<string, string>;
};

export interface VJPlayerRef {
  getPlayer: () => VJPlayerInterface | null;
  getCurrentTime: () => number | null;
  setSyncData: (syncData: VJSyncData) => void;
}

// VJ のユーザー側イベント（YouTube / URL 共通で扱える形）
export interface VJPlayerEvents {
  onPaused?: () => void;
  onUnpaused?: () => void;
  onEnded?: () => void;
  onFiltersChange?: (filters: Record<string, string>) => void;
  onMediaReady?: () => void; // URL 再生時（metadata 完了）
}
