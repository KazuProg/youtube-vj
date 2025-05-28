import { YouTubePlayerWrapper } from "./player/YouTubePlayerWrapper.js";
import { TimeCalculator } from "./time/TimeCalculator.js";
import { TimingSynchronizer } from "./sync/TimingSynchronizer.js";
import { FilterProcessor } from "./filter/FilterProcessor.js";
import { VJPlayerManager } from "./managers/VJPlayerManager.js";

/**
 * VJPlayerのファクトリー
 */
export function createVJPlayer(dataManager, options = {}) {
  const playerWrapper = new YouTubePlayerWrapper();
  const timeCalculator = new TimeCalculator();
  const timingSynchronizer = new TimingSynchronizer();
  const filterProcessor = new FilterProcessor();

  return new VJPlayerManager(
    playerWrapper,
    timeCalculator,
    timingSynchronizer,
    filterProcessor,
    dataManager,
    options
  );
}

// 各クラスもエクスポート（テスト用）
export { YouTubePlayerWrapper } from "./player/YouTubePlayerWrapper.js";
export { TimeCalculator } from "./time/TimeCalculator.js";
export { TimingSynchronizer } from "./sync/TimingSynchronizer.js";
export { FilterProcessor } from "./filter/FilterProcessor.js";
export { VJPlayerManager } from "./managers/VJPlayerManager.js";

// インターフェースもエクスポート
export { IYouTubePlayerWrapper } from "./interfaces/IYouTubePlayerWrapper.js";
export { ITimeCalculator } from "./interfaces/ITimeCalculator.js";
export { ITimingSynchronizer } from "./interfaces/ITimingSynchronizer.js";
export { IFilterProcessor } from "./interfaces/IFilterProcessor.js";
