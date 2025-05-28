/**
 * タイトルキャッシュのインターフェース
 */
export class ITitleCache {
  /**
   * タイトルを取得
   * @param {string} id - YouTube動画ID
   * @returns {string|null|""} タイトル文字列、取得予定はnull、取得中は""
   */
  get(id) {
    throw new Error("Method 'get' must be implemented");
  }

  /**
   * タイトルを設定
   * @param {string} id - YouTube動画ID
   * @param {string|null|""} title - タイトル
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
}
