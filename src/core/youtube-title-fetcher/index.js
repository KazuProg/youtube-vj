import { TitleCache } from "./cache/TitleCache.js";
import { ConcurrencyManager } from "./concurrency/ConcurrencyManager.js";
import { YouTubePlayerService } from "./services/YouTubePlayerService.js";
import { TitleFetchManager } from "./managers/TitleFetchManager.js";

/**
 * YouTube Title Fetcherのファクトリー
 */
export function createYouTubeTitleFetcher(maxConcurrent = 3) {
  const cache = new TitleCache();
  const concurrencyManager = new ConcurrencyManager(maxConcurrent);
  const playerService = new YouTubePlayerService();

  return new TitleFetchManager(cache, concurrencyManager, playerService);
}

// 各クラスもエクスポート（テスト用）
export { TitleCache } from "./cache/TitleCache.js";
export { ConcurrencyManager } from "./concurrency/ConcurrencyManager.js";
export { YouTubePlayerService } from "./services/YouTubePlayerService.js";
export { TitleFetchManager } from "./managers/TitleFetchManager.js";

// インターフェースもエクスポート
export { ITitleCache } from "./interfaces/ITitleCache.js";
export { IConcurrencyManager } from "./interfaces/IConcurrencyManager.js";
export { IYouTubePlayerService } from "./interfaces/IYouTubePlayerService.js";
