/**
 * タイトルキャッシュのインターフェース
 */
export class ITitleCache {
  /**
   * タイトルを取得
   * @param {string} id - YouTube動画ID
   * @returns {string|Symbol} タイトル文字列または状態Symbol
   */
  get(id) {
    throw new Error("Method 'get' must be implemented");
  }

  /**
   * タイトルを設定
   * @param {string} id - YouTube動画ID
   * @param {string|Symbol} title - タイトルまたは状態Symbol
   */
  set(id, title) {
    throw new Error("Method 'set' must be implemented");
  }

  /**
   * IDが存在するかチェック
   * @param {string} id - YouTube動画ID
   * @returns {boolean}
   */
  has(id) {
    throw new Error("Method 'has' must be implemented");
  }

  /**
   * 取得中状態に設定
   * @param {string} id - YouTube動画ID
   */
  setFetching(id) {
    throw new Error("Method 'setFetching' must be implemented");
  }

  /**
   * 取得予定状態に設定
   * @param {string} id - YouTube動画ID
   */
  setPending(id) {
    throw new Error("Method 'setPending' must be implemented");
  }

  /**
   * 取得済みかチェック
   * @param {string} id - YouTube動画ID
   * @returns {boolean}
   */
  isFetched(id) {
    throw new Error("Method 'isFetched' must be implemented");
  }

  /**
   * 取得中かチェック
   * @param {string} id - YouTube動画ID
   * @returns {boolean}
   */
  isFetching(id) {
    throw new Error("Method 'isFetching' must be implemented");
  }

  /**
   * 取得予定かチェック
   * @param {string} id - YouTube動画ID
   * @returns {boolean}
   */
  isPending(id) {
    throw new Error("Method 'isPending' must be implemented");
  }

  /**
   * 取得中のIDリストを取得
   * @returns {string[]}
   */
  getFetchingIds() {
    throw new Error("Method 'getFetchingIds' must be implemented");
  }

  /**
   * 取得予定のIDリストを取得
   * @returns {string[]}
   */
  getPendingIds() {
    throw new Error("Method 'getPendingIds' must be implemented");
  }

  /**
   * 取得済みタイトルを取得（状態Symbolの場合はundefinedを返す）
   * @param {string} id - YouTube動画ID
   * @returns {string|undefined}
   */
  getTitle(id) {
    throw new Error("Method 'getTitle' must be implemented");
  }
}
