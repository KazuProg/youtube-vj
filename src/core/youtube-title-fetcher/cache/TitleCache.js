import { ITitleCache } from "../interfaces/ITitleCache.js";

/**
 * タイトルキャッシュの実装
 */
export class TitleCache extends ITitleCache {
  #cache = {}; // 取得予定はnull、取得中は""、取得済みはタイトル文字列

  /**
   * タイトルを取得
   * @param {string} id - YouTube動画ID
   * @returns {string|null|""} タイトル文字列、取得予定はnull、取得中は""
   */
  get(id) {
    return this.#cache[id];
  }

  /**
   * タイトルを設定
   * @param {string} id - YouTube動画ID
   * @param {string|null|""} title - タイトル
   */
  set(id, title) {
    this.#cache[id] = title;
  }

  /**
   * IDが存在するかチェック
   * @param {string} id - YouTube動画ID
   * @returns {boolean}
   */
  has(id) {
    return id in this.#cache;
  }

  /**
   * 取得中のIDリストを取得
   * @returns {string[]}
   */
  getFetchingIds() {
    return Object.keys(this.#cache).filter((id) => this.#cache[id] === "");
  }

  /**
   * 取得予定のIDリストを取得
   * @returns {string[]}
   */
  getPendingIds() {
    return Object.keys(this.#cache).filter((id) => this.#cache[id] === null);
  }
}
