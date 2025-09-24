/**
 * VJアプリケーション共通の型定義
 */

import type { YTPlayer, YTPlayerEvent, YTPlayerState } from "./youtube";
import { YT_PLAYER_STATE } from "./youtube";

/** YouTubeプレイヤーの状態 */
export interface PlayerStatus {
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
export const PLAYER_STATE_MAP: Record<YTPlayerState, string> = {
  [YT_PLAYER_STATE.UNSTARTED]: "再生前",
  [YT_PLAYER_STATE.ENDED]: "終了",
  [YT_PLAYER_STATE.PLAYING]: "再生中",
  [YT_PLAYER_STATE.PAUSED]: "一時停止",
  [YT_PLAYER_STATE.BUFFERING]: "バッファリング",
  [YT_PLAYER_STATE.CUED]: "頭出し済み",
} as const;

/** VJプレイヤーのRef型 */
export interface VJPlayerRef {
  getPlayer: () => YTPlayer | null;
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
  loadVideoById: (videoId: string) => void;
  playerState: number;
  playbackRate: number;
  duration: number;
}

/** 共通のプロパティ型 */
export interface VJPlayerProps {
  className?: string;
  onStateChange?: (state: YTPlayerEvent) => void;
  onStatusChange?: (status: PlayerStatus) => void;
  syncKey?: string;
  videoId?: string;
}

export interface VJPlayerForControllerProps extends VJPlayerProps {
  videoId?: string;
  onPlaybackRateChange?: (rate: number) => void;
}

/** デフォルト値 */
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
  lastUpdated: 0,
  paused: false,
} as const;
