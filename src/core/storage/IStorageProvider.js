/**
 * ストレージプロバイダーのインターフェース
 * Dependency Inversion Principle: 抽象に依存するためのインターフェース
 * Interface Segregation Principle: ストレージ操作のみに特化
 */
export class IStorageProvider {
  /**
   * データを取得します
   * @param {string} key - ストレージキー
   * @returns {string|null} 取得したデータ
   */
  getItem(key) {
    throw new Error("getItem method must be implemented");
  }

  /**
   * データを保存します
   * @param {string} key - ストレージキー
   * @param {string} value - 保存するデータ
   */
  setItem(key, value) {
    throw new Error("setItem method must be implemented");
  }

  /**
   * データを削除します
   * @param {string} key - ストレージキー
   */
  removeItem(key) {
    throw new Error("removeItem method must be implemented");
  }

  /**
   * すべてのデータをクリアします
   */
  clear() {
    throw new Error("clear method must be implemented");
  }
}
