/**
 * YouTube iFrame API の型定義
 * https://developers.google.com/youtube/iframe_api_reference
 */

// YouTube iFrame API のグローバル型
declare global {
  interface Window {
    // biome-ignore lint/style/useNamingConvention: YouTube API naming
    YT: YT;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// プレイヤー状態定数
export const YT_PLAYER_STATE = {
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  UNSTARTED: -1,
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  ENDED: 0,
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  PLAYING: 1,
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  PAUSED: 2,
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  BUFFERING: 3,
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  CUED: 5,
} as const;

export type YTPlayerState = (typeof YT_PLAYER_STATE)[keyof typeof YT_PLAYER_STATE];

// プレイヤーイベント型
export interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

// プレイヤーイベントハンドラー型
export interface YTPlayerEventHandlers {
  onReady?: (event: YTPlayerEvent) => void;
  onStateChange?: (event: YTPlayerEvent) => void;
  onPlaybackQualityChange?: (event: YTPlayerEvent) => void;
  onPlaybackRateChange?: (event: YTPlayerEvent) => void;
  onError?: (event: YTPlayerEvent) => void;
  onApiChange?: (event: YTPlayerEvent) => void;
  onAutoplayBlocked?: (event: YTPlayerEvent) => void;
}

// プレイヤーオプション型
export interface YTPlayerOptions {
  width?: number;
  height?: number;
  videoId?: string;
  playerVars?: {
    autoplay?: 0 | 1;
    // biome-ignore lint/style/useNamingConvention: YouTube API parameter
    cc_lang_pref?: string;
    // biome-ignore lint/style/useNamingConvention: YouTube API parameter
    cc_load_policy?: 0 | 1;
    color?: "red" | "white";
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    end?: number;
    fs?: 0 | 1;
    hl?: string;
    // biome-ignore lint/style/useNamingConvention: YouTube API parameter
    iv_load_policy?: 1 | 3;
    list?: string | string[];
    listType?: "playlist" | "user_uploads";
    loop?: 0 | 1;
    origin?: string;
    playlist?: string[];
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    start?: number;
    // biome-ignore lint/style/useNamingConvention: YouTube API parameter
    widget_referrer?: string;
    [key: string]: string | number | boolean | string[] | undefined;
  };
  events?: YTPlayerEventHandlers;
}

// プレイヤークラス型
export interface YTPlayer {
  // Queueing functions for videos
  cueVideoById(videoId: string, startSeconds?: number): void;
  cueVideoById(obj: {
    videoId: string;
    startSeconds?: number;
    endSeconds?: number;
  }): void;
  loadVideoById(videoId: string, startSeconds?: number): void;
  loadVideoById(obj: {
    videoId: string;
    startSeconds?: number;
    endSeconds?: number;
  }): void;
  cueVideoByUrl(mediaContentUrl: string, startSeconds?: number): void;
  cueVideoByUrl(obj: {
    mediaContentUrl: string;
    startSeconds?: number;
    endSeconds?: number;
  }): void;
  loadVideoByUrl(mediaContentUrl: string, startSeconds?: number): void;
  loadVideoByUrl(obj: {
    mediaContentUrl: string;
    startSeconds?: number;
    endSeconds?: number;
  }): void;

  // Queueing functions for lists
  cuePlaylist(playlist: string | string[], index?: number, startSeconds?: number): void;
  cuePlaylist(obj: {
    listType?: "playlist" | "user_uploads";
    list: string;
    index?: number;
    startSeconds?: number;
  }): void;
  loadPlaylist(playlist: string | string[], index?: number, startSeconds?: number): void;
  loadPlaylist(obj: {
    list: string;
    listType?: "playlist" | "user_uploads";
    index?: number;
    startSeconds?: number;
  }): void;

  // Playback controls and player settings
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;

  // Controlling playback of 360° videos
  getSphericalProperties(): {
    yaw: number;
    pitch: number;
    roll: number;
    fov: number;
  };
  setSphericalProperties(properties: {
    yaw: number;
    pitch: number;
    roll: number;
    fov: number;
    enableOrientationSensor: boolean;
  }): void;

  // Playing a video in a playlist
  nextVideo(): void;
  previousVideo(): void;
  playVideoAt(index: number): void;

  // Changing the player volume
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;

  // Setting the player size
  setSize(width: number, height: number): void;

  // Setting the playback rate
  getPlaybackRate(): number;
  setPlaybackRate(suggestedRate: number): void;
  getAvailablePlaybackRates(): number[];

  // Setting playback behavior for playlists
  setLoop(loopPlaylists: boolean): void;
  setShuffle(shufflePlaylist: boolean): void;

  // Playback status
  getVideoLoadedFraction(): number;
  getPlayerState(): number;
  getCurrentTime(): number;

  // Retrieving video information
  getDuration(): number;
  getVideoUrl(): string;
  getVideoEmbedCode(): string;

  // Retrieving playlist information
  getPlaylist(): string[];
  getPlaylistIndex(): number;

  // Adding or removing an event listener
  addEventListener(event: string, listener: (event: YTPlayerEvent) => void): void;
  removeEventListener(event: string, listener: (event: YTPlayerEvent) => void): void;

  // Accessing and modifying DOM nodes
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}

// YouTube iFrame API のメイン型
// biome-ignore lint/style/useNamingConvention: YouTube API interface
export interface YT {
  // biome-ignore lint/style/useNamingConvention: YouTube API properties
  Player: new (
    elementId: string | HTMLElement,
    config: YTPlayerOptions
  ) => YTPlayer;
  // biome-ignore lint/style/useNamingConvention: YouTube API properties
  PlayerState: typeof YT_PLAYER_STATE;
}

// エラー定数
export const YT_PLAYER_ERROR = {
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  INVALID_PARAMETER: 2,
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  HTML5_PLAYER: 5,
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  VIDEO_NOT_FOUND: 100,
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  VIDEO_NOT_PLAYABLE_IN_EMBEDDED_PLAYER1: 101,
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  VIDEO_NOT_PLAYABLE_IN_EMBEDDED_PLAYER2: 150,
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  NO_HTTP_REFERER_HEADER_OR_API_CLIENT_KEY: 153,
} as const;

export type YTPlayerError = (typeof YT_PLAYER_ERROR)[keyof typeof YT_PLAYER_ERROR];

// 再生品質定数
export const YT_PLAYER_QUALITY = {
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  SMALL: "small",
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  MEDIUM: "medium",
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  LARGE: "large",
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  HD720: "hd720",
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  HD1080: "hd1080",
  // biome-ignore lint/style/useNamingConvention: YouTube API constants
  HIGH_RES: "highres",
} as const;

export type YTPlayerQuality = (typeof YT_PLAYER_QUALITY)[keyof typeof YT_PLAYER_QUALITY];
