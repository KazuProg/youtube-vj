import { IYouTubeSearchService } from "../interfaces/IYouTubeSearchService.js";

/**
 * YouTube検索サービスの実装
 */
export class YouTubeSearchService extends IYouTubeSearchService {
  #configManager;
  #titleFetcher;

  constructor(configManager, titleFetcher) {
    super();
    this.#configManager = configManager;
    this.#titleFetcher = titleFetcher;
  }

  /**
   * キーワードでYouTube動画を検索する
   * @param {string} keyword - 検索キーワード
   * @returns {Promise<string[]>} - 動画IDの配列
   */
  async search(keyword) {
    if (!this.isAvailable()) {
      throw new Error("YouTube API key is not set.");
    }

    const apiKey = this.#configManager.youtubeAPIKey;
    const maxResults = this.#configManager.youtubeAPIRequests;

    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      keyword
    )}&key=${apiKey}&maxResults=${maxResults}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const videos = data.items;
      const videoIds = videos.map((video) => video.id.videoId);

      // タイトル情報を事前に登録
      videos.forEach((video) => {
        this.#titleFetcher.addManually(video.id.videoId, video.snippet.title);
      });

      return videoIds;
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      throw error;
    }
  }

  /**
   * 検索が利用可能かどうかを確認
   * @returns {boolean} - 検索が利用可能かどうか
   */
  isAvailable() {
    const apiKey = this.#configManager.youtubeAPIKey;
    return apiKey && apiKey.trim() !== "";
  }
}
