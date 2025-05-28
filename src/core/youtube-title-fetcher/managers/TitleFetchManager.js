/**
 * タイトル取得管理クラス
 * 各コンポーネントを統合してタイトル取得を管理
 */
export class TitleFetchManager {
  #cache;
  #concurrencyManager;
  #playerService;

  /**
   * @param {ITitleCache} cache - タイトルキャッシュ
   * @param {IConcurrencyManager} concurrencyManager - 同時実行制御
   * @param {IYouTubePlayerService} playerService - YouTube Playerサービス
   */
  constructor(cache, concurrencyManager, playerService) {
    this.#cache = cache;
    this.#concurrencyManager = concurrencyManager;
    this.#playerService = playerService;
  }

  /**
   * 初期化
   * @param {string} containerSelector - プレイヤーコンテナのセレクター
   */
  init(containerSelector) {
    this.#playerService.init(containerSelector);
  }

  /**
   * タイトルを取得
   * @param {string} id - YouTube動画ID
   * @returns {Promise<string>} タイトル
   */
  async fetch(id) {
    // キャッシュにない場合は取得予定として登録
    if (!this.#cache.has(id)) {
      this.#cache.set(id, null);
      this.#processQueue();
    }

    return this.#waitForResult(id);
  }

  /**
   * 手動でタイトルを追加
   * @param {string} id - YouTube動画ID
   * @param {string} title - タイトル
   */
  addManually(id, title) {
    this.#cache.set(id, title);
  }

  /**
   * キューを処理して取得を開始
   */
  #processQueue() {
    while (this.#concurrencyManager.canExecute()) {
      const pendingIds = this.#cache.getPendingIds();
      if (pendingIds.length === 0) {
        break;
      }

      const id = pendingIds[0];
      this.#startFetch(id);
    }
  }

  /**
   * 個別の取得を開始
   * @param {string} id - YouTube動画ID
   */
  async #startFetch(id) {
    try {
      this.#cache.set(id, ""); // 取得中状態に設定
      this.#concurrencyManager.startTask(id);

      const title = await this.#playerService.fetchTitle(id);
      this.#cache.set(id, title);
    } catch (error) {
      // エラーの場合は取得予定状態に戻す
      this.#cache.set(id, null);
      console.error(`Failed to fetch title for ${id}:`, error);
    } finally {
      this.#concurrencyManager.endTask(id);
      // 次のキューを処理
      this.#processQueue();
    }
  }

  /**
   * 結果を待機
   * @param {string} id - YouTube動画ID
   * @returns {Promise<string>} タイトル
   */
  #waitForResult(id) {
    return new Promise((resolve) => {
      const checkResult = () => {
        const title = this.#cache.get(id);
        if (title !== null && title !== "") {
          resolve(title);
        } else {
          setTimeout(checkResult, 10);
        }
      };
      checkResult();
    });
  }
}
