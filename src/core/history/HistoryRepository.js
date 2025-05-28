import { IHistoryRepository } from "./IHistoryRepository.js";
import { StorageConstants } from "../constants/index.js";

/**
 * 履歴データの永続化を行う具体的な実装
 * Single Responsibility Principle: 履歴データの永続化のみを責務とする
 */
export class HistoryRepository extends IHistoryRepository {
  #storageService;
  #storageKey;

  /**
   * @param {JsonStorageService} storageService - ストレージサービス
   */
  constructor(storageService) {
    super();
    this.#storageService = storageService;
    this.#storageKey = StorageConstants.PLAY_HISTORY;
  }

  /**
   * すべての履歴を取得します
   * @returns {string[]} 履歴の配列
   */
  getAll() {
    return this.#storageService.getJson(this.#storageKey, []);
  }

  /**
   * 履歴を保存します
   * @param {string[]} history - 履歴の配列
   */
  save(history) {
    if (!Array.isArray(history)) {
      throw new Error("History must be an array");
    }
    this.#storageService.setJson(this.#storageKey, history);
  }

  /**
   * 履歴をクリアします
   */
  clear() {
    this.#storageService.remove(this.#storageKey);
  }
}
