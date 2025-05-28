import { IStorageProvider } from "./IStorageProvider.js";

/**
 * LocalStorageを使用したストレージプロバイダー
 * Liskov Substitution Principle: IStorageProviderの契約を満たす実装
 */
export class LocalStorageProvider extends IStorageProvider {
  /**
   * LocalStorageからデータを取得します
   * @param {string} key - ストレージキー
   * @returns {string|null} 取得したデータ
   */
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * LocalStorageにデータを保存します
   * @param {string} key - ストレージキー
   * @param {string} value - 保存するデータ
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set item to localStorage: ${key}`, error);
      throw error;
    }
  }

  /**
   * LocalStorageからデータを削除します
   * @param {string} key - ストレージキー
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item from localStorage: ${key}`, error);
      throw error;
    }
  }

  /**
   * LocalStorageのすべてのデータをクリアします
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear localStorage", error);
      throw error;
    }
  }
}
