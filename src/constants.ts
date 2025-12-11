export const LOCAL_STORAGE_KEY = {
  leftDeck: "ytvj_left_deck",
  mixer: "ytvj_mixer",
  history: "ytvj_history",
  settings: "ytvj_settings",
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

/** プレイヤー同期関連の定数 */
export const SYNC_CONFIG = {
  /** 定期的な同期間隔（ms） */
  interval: 1000,
  /** 強制シークの閾値（秒） */
  seekThreshold: 1.0,
  /** 同期完了の閾値（秒） */
  syncThreshold: 0.01,
  /** 速度調整の最大調整値 */
  maxAdjustment: 0.5,
  /** 速度調整値の変更閾値 */
  rateChangeThreshold: 0.05,
  /** 速度調整のタイムアウト（ms） */
  rateAdjustmentTimeout: 2000,
  /** 再生速度の最小値 */
  minPlaybackRate: 0.25,
  /** 再生速度の最大値 */
  maxPlaybackRate: 2.0,
} as const;
