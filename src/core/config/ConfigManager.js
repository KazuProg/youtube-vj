import { StorageConstants } from "../constants/index.js";
import { getDefaultConfig } from "./ConfigSchema.js";

/**
 * アプリケーション設定を管理するクラス
 * Single Responsibility Principle: 設定の管理のみを責務とする
 * Dependency Inversion Principle: 抽象（インターフェース）に依存
 */
export class ConfigManager {
  #config = {};
  #storageService;
  #validator;
  #storageKey;

  /**
   * @param {JsonStorageService} storageService - ストレージサービス
   * @param {IConfigValidator} validator - 設定値検証器
   */
  constructor(storageService, validator) {
    this.#storageService = storageService;
    this.#validator = validator;
    this.#storageKey = StorageConstants.APP_SETTINGS;

    this.#initializeConfig();
  }

  /**
   * 設定を初期化します
   */
  #initializeConfig() {
    // スキーマからデフォルト設定を取得
    Object.assign(this.#config, getDefaultConfig());

    // 保存された設定を読み込み
    const savedConfig = this.#storageService.getJson(this.#storageKey, {});

    // 有効な設定のみをマージ
    for (const key in savedConfig) {
      if (this.#validator.validate(key, savedConfig[key])) {
        this.#config[key] = savedConfig[key];
      } else {
        console.warn(
          `Invalid config value ignored: ${key} = ${savedConfig[key]}`
        );
      }
    }
  }

  /**
   * 設定値を取得します
   * @param {string} key - 設定キー
   * @returns {*} 設定値
   */
  get(key) {
    return this.#config[key];
  }

  /**
   * 設定値を設定します
   * @param {string} key - 設定キー
   * @param {*} value - 設定値
   * @returns {boolean} 設定成功の可否
   */
  set(key, value) {
    if (!this.#validator.validate(key, value)) {
      const errorMessage = this.#validator.getErrorMessage(key, value);
      console.warn(`Invalid config value: ${errorMessage}`);
      return false;
    }

    this.#config[key] = value;
    this.#save();
    return true;
  }

  /**
   * すべての設定を取得します
   * @returns {Object} 設定オブジェクトのコピー
   */
  getAllConfig() {
    return { ...this.#config };
  }

  /**
   * 設定をリセットします
   */
  resetConfig() {
    Object.assign(this.#config, getDefaultConfig());
    this.#save();
  }

  /**
   * 設定をストレージに保存します
   */
  #save() {
    this.#storageService.setJson(this.#storageKey, this.#config);
  }
}
