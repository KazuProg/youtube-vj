/**
 * YouTube Playerサービスのインターフェース
 */
export class IYouTubePlayerService {
  /**
   * 動画のタイトルを取得
   * @param {string} id - YouTube動画ID
   * @returns {Promise<string>} タイトル
   */
  fetchTitle(id) {
    throw new Error("Method 'fetchTitle' must be implemented");
  }

  /**
   * 初期化
   * @param {string} containerSelector - プレイヤーコンテナのセレクター
   */
  init(containerSelector) {
    throw new Error("Method 'init' must be implemented");
  }
}
