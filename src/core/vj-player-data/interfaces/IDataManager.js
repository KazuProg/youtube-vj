/**
 * データ管理のインターフェース
 */
export class IDataManager {
  /**
   * すべてのデータを取得
   * @returns {Object} すべてのデータ
   */
  getAll() {
    throw new Error("getAll method must be implemented");
  }

  /**
   * データを適用
   * @param {Object} data - 適用するデータ
   */
  applyData(data) {
    throw new Error("applyData method must be implemented");
  }

  /**
   * すべてのデータ変更イベントを発火
   */
  dispatchAll() {
    throw new Error("dispatchAll method must be implemented");
  }

  /**
   * イベントリスナーを追加
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック
   */
  addEventListener(event, callback) {
    throw new Error("addEventListener method must be implemented");
  }
}
