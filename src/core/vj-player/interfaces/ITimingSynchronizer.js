/**
 * タイミング同期のインターフェース
 */
export class ITimingSynchronizer {
  /**
   * 同期を開始
   * @param {IYouTubePlayerWrapper} player - プレイヤー
   * @param {Object} dataManager - データマネージャー
   * @param {ITimeCalculator} timeCalculator - 時間計算器
   * @param {Function} onSyncStart - 同期開始コールバック
   * @param {Function} onSyncEnd - 同期終了コールバック
   */
  startSync(player, dataManager, timeCalculator, onSyncStart, onSyncEnd) {
    throw new Error("Method 'startSync' must be implemented");
  }

  /**
   * 同期を停止
   */
  stopSync() {
    throw new Error("Method 'stopSync' must be implemented");
  }

  /**
   * 同期中かどうか
   * @returns {boolean} 同期中フラグ
   */
  isSyncing() {
    throw new Error("Method 'isSyncing' must be implemented");
  }
}
