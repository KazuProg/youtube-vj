import { AppConstants } from "../constants/index.js";

/**
 * 履歴管理のビジネスロジックを担当するクラス
 * Single Responsibility Principle: 履歴管理のビジネスロジックのみを責務とする
 * Dependency Inversion Principle: 抽象（インターフェース）に依存
 */
export class HistoryManager {
  #repository;
  #maxHistorySize;

  /**
   * @param {IHistoryRepository} repository - 履歴リポジトリ
   * @param {number} maxHistorySize - 履歴の最大保存数
   */
  constructor(repository, maxHistorySize = AppConstants.HISTORY_MAX) {
    this.#repository = repository;
    this.#maxHistorySize = maxHistorySize;
  }

  /**
   * すべての履歴を取得します
   * @returns {string[]} 履歴の配列
   */
  getAll() {
    return this.#repository.getAll();
  }

  /**
   * 履歴に動画IDを追加します
   * @param {string} videoId - 追加する動画ID
   * @returns {boolean} 追加が成功したかどうか
   */
  add(videoId) {
    if (!videoId || typeof videoId !== "string") {
      console.warn("Invalid videoId provided to history");
      return false;
    }

    let history = this.getAll();

    // 直前の履歴と同じ場合は追加しない
    if (history.length > 0 && history[history.length - 1] === videoId) {
      return false;
    }

    history.push(videoId);

    // 最大サイズを超えた場合は古いものを削除
    if (history.length > this.#maxHistorySize) {
      history = history.slice(-this.#maxHistorySize);
    }

    this.#repository.save(history);
    return true;
  }

  /**
   * 履歴をすべて置き換えます
   * @param {string[]} videoIds - 新しい履歴の配列
   */
  replaceAll(videoIds) {
    if (!Array.isArray(videoIds)) {
      throw new Error("videoIds must be an array");
    }

    // 有効な動画IDのみをフィルタリング
    const validVideoIds = videoIds.filter((id) => id && typeof id === "string");

    // 最大サイズに制限
    const limitedHistory = validVideoIds.slice(-this.#maxHistorySize);

    this.#repository.save(limitedHistory);
  }

  /**
   * 履歴をクリアします
   */
  clear() {
    this.#repository.clear();
  }

  /**
   * 履歴のサイズを取得します
   * @returns {number} 履歴のサイズ
   */
  getSize() {
    return this.getAll().length;
  }

  /**
   * 最新の履歴エントリを取得します
   * @returns {string|null} 最新の動画ID
   */
  getLatest() {
    const history = this.getAll();
    return history.length > 0 ? history[history.length - 1] : null;
  }
}
