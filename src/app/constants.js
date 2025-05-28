import { AppConstants as CoreAppConstants } from "../core/constants/AppConstants.js";
import { StorageConstants } from "../core/constants/StorageConstants.js";

/**
 * アプリケーション全体で利用する定数を定義します。
 * 新しいSOLID原則に基づく実装を使用
 */
export const AppConstants = {
  LOCAL_STORAGE_KEYS: {
    APP_SETTINGS: StorageConstants.APP_SETTINGS,
    PLAY_HISTORY: StorageConstants.PLAY_HISTORY,
    CTRL_CH_0: StorageConstants.CTRL_CH_0,
    CTRL_CH_1: StorageConstants.CTRL_CH_1,
    CTRL_MASTER: StorageConstants.CTRL_MASTER,
  },
  SYNC_INTERVAL: CoreAppConstants.SYNC_INTERVAL,
  HISTORY_MAX: CoreAppConstants.HISTORY_MAX,
};
