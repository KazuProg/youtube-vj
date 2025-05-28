import { ConfigManager } from "../core/config/ConfigManager.js";
import { ConfigValidator } from "../core/config/ConfigValidator.js";
import { JsonStorageService } from "../core/storage/JsonStorageService.js";
import { LocalStorageProvider } from "../core/storage/LocalStorageProvider.js";

/**
 * アプリケーション設定を管理するクラス
 * 新しいSOLID原則に基づく実装を使用
 */
class Config {
  static #configManager;

  static {
    // 依存関係の注入
    const storageProvider = new LocalStorageProvider();
    const storageService = new JsonStorageService(storageProvider);
    const validator = new ConfigValidator();

    Config.#configManager = new ConfigManager(storageService, validator);
  }

  static get fadeoutVolume() {
    return Config.#configManager.get("fadeoutVolume");
  }

  static get openLibrary() {
    return Config.#configManager.get("openLibrary");
  }

  static get youtubeAPIKey() {
    return Config.#configManager.get("youtubeAPIKey");
  }

  static get youtubeAPIRequests() {
    return Config.#configManager.get("youtubeAPIRequests");
  }

  static set fadeoutVolume(value) {
    if (!Config.#configManager.set("fadeoutVolume", value)) {
      console.warn("Invalid value for fadeoutVolume: must be a boolean.");
    }
  }

  static set openLibrary(value) {
    if (!Config.#configManager.set("openLibrary", value)) {
      console.warn("Invalid value for openLibrary: must be a boolean.");
    }
  }

  static set youtubeAPIKey(value) {
    if (!Config.#configManager.set("youtubeAPIKey", value)) {
      console.warn("Invalid value for youtubeAPIKey: must be a string.");
    }
  }

  static set youtubeAPIRequests(value) {
    if (!Config.#configManager.set("youtubeAPIRequests", value)) {
      console.warn(
        "Invalid value for youtubeAPIRequests: must be a non-negative integer."
      );
    }
  }

  static getAllConfig() {
    return Config.#configManager.getAllConfig();
  }

  static resetConfig() {
    Config.#configManager.resetConfig();
  }
}

export default Config;
