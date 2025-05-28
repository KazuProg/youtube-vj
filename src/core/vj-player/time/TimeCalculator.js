import { ITimeCalculator } from "../interfaces/ITimeCalculator.js";

/**
 * 時間計算の実装
 */
export class TimeCalculator extends ITimeCalculator {
  /**
   * 現在時間を計算
   * @param {Object} dataManager - データマネージャー
   * @returns {number} 現在時間
   */
  calculateCurrentTime(dataManager) {
    const TIMING = dataManager.timing;
    const TIMESTAMP_NOW = new Date() / 1000;

    if (TIMING.timestamp === 0) return 0;
    if (dataManager.pause) return TIMING.playerTime;

    let expectPlayerTime =
      TIMING.playerTime +
      (TIMESTAMP_NOW - TIMING.timestamp) * dataManager.speed;

    if (dataManager.isLoop && dataManager.loop.end < expectPlayerTime) {
      expectPlayerTime = this.applyLoop(dataManager, expectPlayerTime);
    }

    return expectPlayerTime;
  }

  /**
   * ループ処理を適用
   * @param {Object} dataManager - データマネージャー
   * @param {number} expectPlayerTime - 期待される再生時間
   * @returns {number} ループ適用後の時間
   */
  applyLoop(dataManager, expectPlayerTime) {
    const TIMESTAMP_NOW = new Date() / 1000;

    dataManager.timing = {
      timestamp:
        TIMESTAMP_NOW -
        (expectPlayerTime - dataManager.loop.end) / dataManager.speed,
      playerTime: dataManager.loop.start,
    };

    return expectPlayerTime - (dataManager.loop.end - dataManager.loop.start);
  }
}
