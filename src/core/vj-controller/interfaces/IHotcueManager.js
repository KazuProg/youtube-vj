/**
 * ホットキュー管理のインターフェース
 */
export class IHotcueManager {
  /**
   * ホットキューを実行
   * @param {number} index - ホットキューインデックス
   */
  hotcue(index) {
    throw new Error("hotcue method must be implemented");
  }

  /**
   * ホットキューを追加
   * @param {number} index - ホットキューインデックス
   * @param {number} time - 時間
   */
  addHotcue(index, time) {
    throw new Error("addHotcue method must be implemented");
  }

  /**
   * ホットキューを再生
   * @param {number} index - ホットキューインデックス
   */
  playHotcue(index) {
    throw new Error("playHotcue method must be implemented");
  }

  /**
   * ホットキューを削除
   * @param {number} index - ホットキューインデックス
   */
  removeHotcue(index) {
    throw new Error("removeHotcue method must be implemented");
  }

  /**
   * すべてのホットキューをクリア
   */
  clearAllHotcues() {
    throw new Error("clearAllHotcues method must be implemented");
  }
}
