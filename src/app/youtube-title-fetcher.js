import { createYouTubeTitleFetcher } from "../core/youtube-title-fetcher/index.js";

/**
 * YouTube Title Fetcherのファサードクラス
 * 既存のAPIとの後方互換性を保持
 */
class YouTubeTitleFetcherFacade {
  #manager;

  constructor() {
    this.#manager = createYouTubeTitleFetcher(3); // 最大同時取得数3
  }

  /**
   * 初期化
   * @param {string} containerSelector - プレイヤーコンテナのセレクター
   */
  init(containerSelector) {
    this.#manager.init(containerSelector);
  }

  /**
   * タイトルを取得
   * @param {string} id - YouTube動画ID
   * @returns {Promise<string>} タイトル
   */
  fetch(id) {
    return this.#manager.fetch(id);
  }

  /**
   * 手動でタイトルを追加
   * @param {string} id - YouTube動画ID
   * @param {string} title - タイトル
   */
  addManually(id, title) {
    this.#manager.addManually(id, title);
  }
}

// シングルトンインスタンスを作成（既存コードとの互換性のため）
const YouTubeTitleFetcher = new YouTubeTitleFetcherFacade();

export default YouTubeTitleFetcher;
