import { IDataModel } from "../interfaces/IDataModel.js";

/**
 * 速度データモデル
 */
export class SpeedModel extends IDataModel {
  #value = 1;

  /**
   * 値を取得
   * @returns {number} 速度値
   */
  getValue() {
    return structuredClone(this.#value);
  }

  /**
   * 値を設定
   * @param {number} value - 速度値
   */
  setValue(value) {
    if (this.validate(value)) {
      this.#value = value;
    }
  }

  /**
   * 値を検証
   * @param {number} value - 検証する値
   * @returns {boolean} 検証結果
   */
  validate(value) {
    return typeof value === "number" && value >= 0.25 && value <= 2;
  }
}
