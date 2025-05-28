/**
 * ループ管理のインターフェース
 */
export class ILoopManager {
  /**
   * ループ開始点を設定
   * @param {number} time - 開始時間
   */
  setLoopStart(time) {
    throw new Error("setLoopStart method must be implemented");
  }

  /**
   * ループ終了点を設定
   * @param {number} time - 終了時間
   */
  setLoopEnd(time) {
    throw new Error("setLoopEnd method must be implemented");
  }

  /**
   * ループをクリア
   */
  clearLoop() {
    throw new Error("clearLoop method must be implemented");
  }
}
