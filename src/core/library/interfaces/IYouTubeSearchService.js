/**
 * YouTube検索サービスのインターフェース
 */
export class IYouTubeSearchService {
  /**
   * キーワードでYouTube動画を検索する
   * @param {string} keyword - 検索キーワード
   * @returns {Promise<string[]>} - 動画IDの配列
   */
  async search(keyword) {
    throw new Error("Method 'search' must be implemented");
  }

  /**
   * 検索が利用可能かどうかを確認
   * @returns {boolean} - 検索が利用可能かどうか
   */
  isAvailable() {
    throw new Error("Method 'isAvailable' must be implemented");
  }
}
