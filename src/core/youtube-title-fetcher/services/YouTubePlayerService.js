import { IYouTubePlayerService } from "../interfaces/IYouTubePlayerService.js";

/**
 * YouTube Playerサービスの実装
 */
export class YouTubePlayerService extends IYouTubePlayerService {
  #playersContainer;

  /**
   * 初期化
   * @param {string} containerSelector - プレイヤーコンテナのセレクター
   */
  init(containerSelector) {
    this.#playersContainer = document.querySelector(containerSelector);
    if (!this.#playersContainer) {
      throw new Error(`Container not found: ${containerSelector}`);
    }
  }

  /**
   * 動画のタイトルを取得
   * @param {string} id - YouTube動画ID
   * @returns {Promise<string>} タイトル
   */
  fetchTitle(id) {
    return new Promise((resolve, reject) => {
      if (!this.#playersContainer) {
        reject(new Error("Service not initialized"));
        return;
      }

      const playerElem = this.#createPlayerElement(id);
      this.#playersContainer.appendChild(playerElem);

      const cleanup = () => {
        try {
          player.destroy();
        } catch (e) {
          // プレイヤーが既に破棄されている場合は無視
        }
        playerElem.remove();
      };

      const player = new YT.Player(playerElem.id, {
        videoId: id,
        events: {
          onReady: (e) => {
            // 広告が読み込まれる可能性もある？
            e.target.mute();
            e.target.playVideo();
          },
          onStateChange: (e) => {
            const data = e.target.getVideoData();
            // 広告が読み込まれる可能性もある？
            if (data.video_id === id) {
              const title = e.target.videoTitle;
              cleanup();
              resolve(title);
            }
          },
          onError: (e) => {
            cleanup();
            reject(new Error(`YouTube Player error: ${e.data}`));
          },
        },
      });
    });
  }

  /**
   * プレイヤー要素を作成
   * @param {string} id - YouTube動画ID
   * @returns {HTMLElement}
   */
  #createPlayerElement(id) {
    const playerElem = document.createElement("div");
    playerElem.id = `yttf_${id}`;
    return playerElem;
  }
}
