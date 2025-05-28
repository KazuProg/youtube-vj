/**
 * Core モジュールの統合エクスポート
 * 各サブモジュールへの統一されたアクセスポイントを提供
 */

// Constants
export { AppConstants, StorageConstants } from "./constants/index.js";

// Storage
export { IStorageProvider } from "./storage/IStorageProvider.js";
export { LocalStorageProvider } from "./storage/LocalStorageProvider.js";
export { JsonStorageService } from "./storage/JsonStorageService.js";

// Config
export { IConfigValidator } from "./config/IConfigValidator.js";
export { ConfigValidator } from "./config/ConfigValidator.js";
export { ConfigManager } from "./config/ConfigManager.js";

// History
export { IHistoryRepository } from "./history/IHistoryRepository.js";
export { HistoryRepository } from "./history/HistoryRepository.js";
export { HistoryManager } from "./history/HistoryManager.js";
