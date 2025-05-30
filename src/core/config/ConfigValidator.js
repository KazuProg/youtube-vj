import { IConfigValidator } from "./IConfigValidator.js";
import { getValidationRules } from "./ConfigSchema.js";

/**
 * アプリケーション設定の検証を行うクラス
 * Single Responsibility Principle: 設定値の検証のみを責務とする
 */
export class ConfigValidator extends IConfigValidator {
  #validationRules;

  constructor() {
    super();
    // スキーマから検証ルールを取得
    this.#validationRules = getValidationRules();
  }

  /**
   * 設定値を検証します
   * @param {string} key - 設定キー
   * @param {*} value - 検証する値
   * @returns {boolean} 検証結果
   */
  validate(key, value) {
    const rule = this.#validationRules[key];
    if (!rule) {
      return false; // 未知の設定キー
    }

    if (rule.validator) {
      return rule.validator(value);
    }

    return typeof value === rule.type;
  }

  /**
   * 検証エラーメッセージを取得します
   * @param {string} key - 設定キー
   * @param {*} value - 検証に失敗した値
   * @returns {string} エラーメッセージ
   */
  getErrorMessage(key, value) {
    const rule = this.#validationRules[key];
    if (!rule) {
      return `Unknown configuration key: ${key}`;
    }
    return rule.message;
  }

  /**
   * 利用可能な設定キーを取得します
   * @returns {string[]} 設定キーの配列
   */
  getValidKeys() {
    return Object.keys(this.#validationRules);
  }
}
