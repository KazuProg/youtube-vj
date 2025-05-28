/**
 * 定数クラスの統合エクスポート
 * Interface Segregation Principle: 必要な定数のみをインポートできるように分離
 */
export { AppConstants } from "./AppConstants.js";
export { StorageConstants } from "./StorageConstants.js";

// 後方互換性のための統合オブジェクト
export const LegacyAppConstants = {
  LOCAL_STORAGE_KEYS: {
    APP_SETTINGS: "ytvj_config",
    PLAY_HISTORY: "ytvj_history",
    CTRL_CH_0: "ytvj_ch0",
    CTRL_CH_1: "ytvj_ch1",
    CTRL_MASTER: "ytvj_sys",
  },
  SYNC_INTERVAL: 3000,
  HISTORY_MAX: 100,
};
