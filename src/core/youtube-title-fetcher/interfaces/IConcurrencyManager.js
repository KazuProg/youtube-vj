/**
 * 同時実行制御のインターフェース
 */
export class IConcurrencyManager {
  /**
   * タスクを実行可能かチェック
   * @returns {boolean}
   */
  canExecute() {
    throw new Error("Method 'canExecute' must be implemented");
  }

  /**
   * タスクの実行を開始
   * @param {string} id - タスクID
   */
  startTask(id) {
    throw new Error("Method 'startTask' must be implemented");
  }

  /**
   * タスクの実行を終了
   * @param {string} id - タスクID
   */
  endTask(id) {
    throw new Error("Method 'endTask' must be implemented");
  }

  /**
   * 実行中のタスク数を取得
   * @returns {number}
   */
  getRunningTaskCount() {
    throw new Error("Method 'getRunningTaskCount' must be implemented");
  }
}
