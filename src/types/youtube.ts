/**
 * YouTube iFrame API の型定義
 * @types/youtube-player を参考に、Promise を排除した独自実装
 */

/* biome-ignore lint/style/useNamingConvention: YouTube iFrame API の公式命名規則に従うため */

// YouTube iFrame API のグローバル型
declare global {
  interface Window {
    YT: YT;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// プレイヤー状態定数
export const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export type YTPlayerState =
  (typeof YT_PLAYER_STATE)[keyof typeof YT_PLAYER_STATE];

// プレイヤーイベント型
export interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

// プレイヤーオプション型
export interface YTPlayerOptions {
  videoId?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1 | 2;
    disablekb?: 0 | 1;
    iv_load_policy?: 1 | 3;
    start?: number;
    end?: number;
    loop?: 0 | 1;
    playlist?: string;
    fs?: 0 | 1;
    cc_load_policy?: 0 | 1;
    modestbranding?: 0 | 1;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    [key: string]: string | number | boolean | undefined;
  };
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTPlayerEvent) => void;
    onPlaybackQualityChange?: (event: YTPlayerEvent) => void;
    onPlaybackRateChange?: (event: YTPlayerEvent) => void;
    onError?: (event: YTPlayerEvent) => void;
    onApiChange?: (event: YTPlayerEvent) => void;
  };
}

// プレイヤークラス型（Promise を排除）
export interface YTPlayer {
  // 再生制御
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;

  // 音量・速度制御
  setVolume(volume: number): void;
  setPlaybackRate(suggestedRate: number): void;
  mute(): void;
  unMute(): void;

  // 状態取得
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getVolume(): number;
  getPlaybackRate(): number;
  isMuted(): boolean;
  getPlayerState(): number;
  getPlaybackQuality(): string;
  getAvailablePlaybackRates(): number[];

  // 動画制御
  loadVideoById(
    videoId: string,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  cueVideoById(
    videoId: string,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  loadVideoByUrl(
    mediaContentUrl: string,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  cueVideoByUrl(
    mediaContentUrl: string,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;

  // プレイリスト制御
  loadPlaylist(
    playlist: string | string[],
    index?: number,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  cuePlaylist(
    playlist: string | string[],
    index?: number,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  nextVideo(): void;
  previousVideo(): void;
  playVideoAt(index: number): void;

  // その他
  destroy(): void;
  getIframe(): HTMLIFrameElement;
  addEventListener(
    event: string,
    listener: (event: YTPlayerEvent) => void
  ): void;
  removeEventListener(
    event: string,
    listener: (event: YTPlayerEvent) => void
  ): void;
}

// YouTube iFrame API のメイン型
export interface YT {
  Player: new (
    elementId: string | HTMLElement,
    config: YTPlayerOptions
  ) => YTPlayer;
  PlayerState: typeof YT_PLAYER_STATE;
  PlayerError: {
    INVALID_PARAMETER: 2;
    HTML5_PLAYER: 5;
    VIDEO_NOT_FOUND: 100;
    VIDEO_NOT_PLAYABLE_IN_EMBEDDED_PLAYER1: 101;
    VIDEO_NOT_PLAYABLE_IN_EMBEDDED_PLAYER2: 150;
  };
  PlayerReadyState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
  PlayerPlaybackQuality: {
    SMALL: "small";
    MEDIUM: "medium";
    LARGE: "large";
    HD720: "hd720";
    HD1080: "hd1080";
    HIGH_RES: "highres";
    DEFAULT: "default";
  };
}

// エラー定数
export const YT_PLAYER_ERROR = {
  INVALID_PARAMETER: 2,
  HTML5_PLAYER: 5,
  VIDEO_NOT_FOUND: 100,
  VIDEO_NOT_PLAYABLE_IN_EMBEDDED_PLAYER1: 101,
  VIDEO_NOT_PLAYABLE_IN_EMBEDDED_PLAYER2: 150,
} as const;

export type YTPlayerError =
  (typeof YT_PLAYER_ERROR)[keyof typeof YT_PLAYER_ERROR];

// 再生品質定数
export const YT_PLAYER_QUALITY = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
  HD720: "hd720",
  HD1080: "hd1080",
  HIGH_RES: "highres",
  DEFAULT: "default",
} as const;

export type YTPlayerQuality =
  (typeof YT_PLAYER_QUALITY)[keyof typeof YT_PLAYER_QUALITY];

// デフォルト値
export const DEFAULT_VIDEO_ID = "BLeUas72Mzk";
export const DEFAULT_PLAYER_OPTIONS: YTPlayerOptions = {
  width: "100%",
  height: "100%",
  playerVars: {
    autoplay: 1,
    controls: 0,
    disablekb: 1,
    iv_load_policy: 3,
  },
};

// プレイヤー状態の日本語表示マップ
export const YT_PLAYER_STATE_MAP: Record<YTPlayerState, string> = {
  [YT_PLAYER_STATE.UNSTARTED]: "再生前",
  [YT_PLAYER_STATE.ENDED]: "終了",
  [YT_PLAYER_STATE.PLAYING]: "再生中",
  [YT_PLAYER_STATE.PAUSED]: "一時停止",
  [YT_PLAYER_STATE.BUFFERING]: "バッファリング",
  [YT_PLAYER_STATE.CUED]: "頭出し済み",
} as const;

// エラーメッセージのマップ
export const YT_PLAYER_ERROR_MAP: Record<YTPlayerError, string> = {
  [YT_PLAYER_ERROR.INVALID_PARAMETER]: "無効なパラメータ",
  [YT_PLAYER_ERROR.HTML5_PLAYER]: "HTML5プレイヤーエラー",
  [YT_PLAYER_ERROR.VIDEO_NOT_FOUND]: "動画が見つかりません",
  [YT_PLAYER_ERROR.VIDEO_NOT_PLAYABLE_IN_EMBEDDED_PLAYER1]:
    "埋め込みプレイヤーで再生できません",
  [YT_PLAYER_ERROR.VIDEO_NOT_PLAYABLE_IN_EMBEDDED_PLAYER2]:
    "埋め込みプレイヤーで再生できません",
} as const;
