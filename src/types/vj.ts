/**
 * VJアプリケーション共通の型定義
 */

import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import type { YouTubePlayer } from "youtube-player/dist/types";

/** YouTubeプレイヤーの状態 */
export interface PlayerStatus {
  playerState: number;
  playbackRate: number;
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
  [PlayerStates.UNSTARTED]: "再生前",
  [PlayerStates.ENDED]: "終了",
  [PlayerStates.PLAYING]: "再生中",
  [PlayerStates.PAUSED]: "一時停止",
  [PlayerStates.BUFFERING]: "バッファリング",
  [PlayerStates.VIDEO_CUED]: "頭出し済み",
} as const;

/** VJプレイヤーのRef型 */
export interface VJPlayerRef {
  originalPlayer: YouTubePlayer;
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
  getCurrentTime: () => number | null;
  isMuted: boolean;
  playerState: number;
  playbackRate: number;
  volume: number;
  duration: number;
}

/** 共通のプロパティ型 */
export interface VJPlayerProps {
  style?: React.CSSProperties;
  onStatusChange?: (status: PlayerStatus) => void;
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
