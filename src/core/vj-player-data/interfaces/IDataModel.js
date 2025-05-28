/**
 * データモデルのインターフェース
 */
export class IDataModel {
  /**
   * 値を取得
   * @returns {*} 値
   */
  getValue() {
    throw new Error("getValue method must be implemented");
  }

  /**
   * 値を設定
   * @param {*} value - 設定する値
   */
  setValue(value) {
    throw new Error("setValue method must be implemented");
  }

  /**
   * 値を検証
   * @param {*} value - 検証する値
   * @returns {boolean} 検証結果
   */
  validate(value) {
    throw new Error("validate method must be implemented");
  }
}
