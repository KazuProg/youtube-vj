/**
 * 設定値の検証を行うインターフェース
 * Interface Segregation Principle: 検証機能のみに特化
 */
export class IConfigValidator {
  /**
   * 設定値を検証します
   * @param {string} key - 設定キー
   * @param {*} value - 検証する値
   * @returns {boolean} 検証結果
   */
  validate(key, value) {
    throw new Error("validate method must be implemented");
  }

  /**
   * 検証エラーメッセージを取得します
   * @param {string} key - 設定キー
   * @param {*} value - 検証に失敗した値
   * @returns {string} エラーメッセージ
   */
  getErrorMessage(key, value) {
    throw new Error("getErrorMessage method must be implemented");
  }
}
