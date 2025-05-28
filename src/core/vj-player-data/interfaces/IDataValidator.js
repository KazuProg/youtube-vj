/**
 * データ検証のインターフェース
 */
export class IDataValidator {
  /**
   * 値を検証
   * @param {*} value - 検証する値
   * @returns {boolean} 検証結果
   */
  validate(value) {
    throw new Error("validate method must be implemented");
  }
}
