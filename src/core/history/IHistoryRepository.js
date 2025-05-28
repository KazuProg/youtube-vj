/**
 * 履歴データの永続化を行うインターフェース
 * Interface Segregation Principle: 履歴データの永続化のみに特化
 */
export class IHistoryRepository {
  /**
   * すべての履歴を取得します
   * @returns {string[]} 履歴の配列
   */
  getAll() {
    throw new Error("getAll method must be implemented");
  }

  /**
   * 履歴を保存します
   * @param {string[]} history - 履歴の配列
   */
  save(history) {
    throw new Error("save method must be implemented");
  }

  /**
   * 履歴をクリアします
   */
  clear() {
    throw new Error("clear method must be implemented");
  }
}
