/**
 * VJアプリケーション共通の型定義
 */

import type { YouTubePlayer } from "youtube-player/dist/types";

/** YouTubeプレイヤーの状態 */
export interface PlayerStatus {
  playerState: number;
  playbackRate: number;
  currentTime: number;
  duration: number;
}

/** 複数プレイヤー間の同期データ */
export interface VJSyncData {
  videoId: string;
  playbackRate: number;
  currentTime: number;
  lastUpdated: number;
  paused: boolean;
}

/** プレイヤー状態の日本語表示マップ */
export const PLAYER_STATE_MAP: Record<number, string> = {
  [-1]: "再生前",
  0: "終了",
  1: "再生中",
  2: "一時停止",
  3: "バッファリング",
  5: "頭出し済み",
} as const;

/** プレイヤー状態の定数 */
export const PLAYER_STATES = {
  unstarted: -1,
  ended: 0,
  playing: 1,
  paused: 2,
  buffering: 3,
  cued: 5,
} as const;

/** VJプレイヤーのRef型 */
export interface VJPlayerRef {
  originalPlayer: YouTubePlayer;
  currentTime: number;
  duration: number;
  getCurrentTime: () => number | null;
}

/** VJコントローラーのRef型 */
export interface VJControllerRef {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  isMuted: boolean;
  playerState: number;
  playbackRate: number;
  volume: number;
  currentTime: number;
  duration: number;
}

/** 共通のプロパティ型 */
export interface VJPlayerProps {
  style?: React.CSSProperties;
  onStatusChange?: (status: PlayerStatus) => void;
  autoLoop?: boolean;
  syncKey?: string;
  videoId?: string;
}

/** デフォルト値 */
export const DEFAULT_VALUES = {
  videoId: "42jhMWfKY9Y",
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
  lastUpdated: 0,
  paused: false,
} as const;
