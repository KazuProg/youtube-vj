import { IDataModel } from "../interfaces/IDataModel.js";

/**
 * フィルターデータモデル
 */
export class FilterModel extends IDataModel {
  #value = {};

  /**
   * 値を取得
   * @returns {Object} フィルター値
   */
  getValue() {
    return structuredClone(this.#value);
  }

  /**
   * 値を設定
   * @param {Object} value - フィルター値
   */
  setValue(value) {
    if (this.validate(value)) {
      this.#value = { ...this.#value, ...value };
    }
  }

  /**
   * 値を検証
   * @param {Object} value - 検証する値
   * @returns {boolean} 検証結果
   */
  validate(value) {
    return typeof value === "object" && value !== null;
  }
}
