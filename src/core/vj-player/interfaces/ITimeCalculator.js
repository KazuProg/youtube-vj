/**
 * 時間計算のインターフェース
 */
export class ITimeCalculator {
  /**
   * 現在時間を計算
   * @param {Object} dataManager - データマネージャー
   * @returns {number} 現在時間
   */
  calculateCurrentTime(dataManager) {
    throw new Error("Method 'calculateCurrentTime' must be implemented");
  }

  /**
   * ループ処理を適用
   * @param {Object} dataManager - データマネージャー
   * @param {number} expectPlayerTime - 期待される再生時間
   * @returns {number} ループ適用後の時間
   */
  applyLoop(dataManager, expectPlayerTime) {
    throw new Error("Method 'applyLoop' must be implemented");
  }
}
