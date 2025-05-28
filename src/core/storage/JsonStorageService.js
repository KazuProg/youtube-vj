/**
 * JSON形式でのストレージ操作を提供するサービス
 * Single Responsibility Principle: JSON形式でのデータ保存・取得のみを責務とする
 * Open/Closed Principle: 新しいデータ型の処理を拡張可能
 */
export class JsonStorageService {
  #storageProvider;

  /**
   * @param {IStorageProvider} storageProvider - ストレージプロバイダー
   */
  constructor(storageProvider) {
    this.#storageProvider = storageProvider;
  }

  /**
   * JSONデータを取得します
   * @param {string} key - ストレージキー
   * @param {*} defaultValue - デフォルト値
   * @returns {*} パースされたJSONデータ
   */
  getJson(key, defaultValue = null) {
    try {
      const data = this.#storageProvider.getItem(key);
      if (data === null) {
        return defaultValue;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to parse JSON from storage: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * JSONデータを保存します
   * @param {string} key - ストレージキー
   * @param {*} value - 保存するデータ
   */
  setJson(key, value) {
    try {
      const jsonString = JSON.stringify(value);
      this.#storageProvider.setItem(key, jsonString);
    } catch (error) {
      console.error(`Failed to stringify and save JSON: ${key}`, error);
      throw error;
    }
  }

  /**
   * データを削除します
   * @param {string} key - ストレージキー
   */
  remove(key) {
    this.#storageProvider.removeItem(key);
  }

  /**
   * すべてのデータをクリアします
   */
  clear() {
    this.#storageProvider.clear();
  }
}
