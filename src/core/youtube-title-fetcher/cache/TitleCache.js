import { ITitleCache } from "../interfaces/ITitleCache.js";

/**
 * タイトルキャッシュの実装
 */
export class TitleCache extends ITitleCache {
  // 状態を表すSymbol
  static #PENDING = Symbol("pending");   // 取得予定
  static #FETCHING = Symbol("fetching"); // 取得中

  #cache = {}; // 取得予定: PENDING Symbol、取得中: FETCHING Symbol、取得済み: タイトル文字列

  /**
   * タイトルを取得
   * @param {string} id - YouTube動画ID
   * @returns {string|Symbol} タイトル文字列または状態Symbol
   */
  get(id) {
    return this.#cache[id];
  }

  /**
   * タイトルを設定
   * @param {string} id - YouTube動画ID
   * @param {string|Symbol} title - タイトルまたは状態Symbol
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
   * 取得中状態に設定
   * @param {string} id - YouTube動画ID
   */
  setFetching(id) {
    this.#cache[id] = TitleCache.#FETCHING;
  }

  /**
   * 取得予定状態に設定
   * @param {string} id - YouTube動画ID
   */
  setPending(id) {
    this.#cache[id] = TitleCache.#PENDING;
  }

  /**
   * 取得済みかチェック
   * @param {string} id - YouTube動画ID
   * @returns {boolean}
   */
  isFetched(id) {
    const value = this.#cache[id];
    return value !== undefined && 
           value !== TitleCache.#PENDING && 
           value !== TitleCache.#FETCHING;
  }

  /**
   * 取得中かチェック
   * @param {string} id - YouTube動画ID
   * @returns {boolean}
   */
  isFetching(id) {
    return this.#cache[id] === TitleCache.#FETCHING;
  }

  /**
   * 取得予定かチェック
   * @param {string} id - YouTube動画ID
   * @returns {boolean}
   */
  isPending(id) {
    return this.#cache[id] === TitleCache.#PENDING;
  }

  /**
   * 取得中のIDリストを取得
   * @returns {string[]}
   */
  getFetchingIds() {
    return Object.keys(this.#cache).filter((id) => this.#cache[id] === TitleCache.#FETCHING);
  }

  /**
   * 取得予定のIDリストを取得
   * @returns {string[]}
   */
  getPendingIds() {
    return Object.keys(this.#cache).filter((id) => this.#cache[id] === TitleCache.#PENDING);
  }

  /**
   * 取得済みタイトルを取得（状態Symbolの場合はundefinedを返す）
   * @param {string} id - YouTube動画ID
   * @returns {string|undefined}
   */
  getTitle(id) {
    const value = this.#cache[id];
    return this.isFetched(id) ? value : undefined;
  }
}
