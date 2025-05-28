import { IDataModel } from "../interfaces/IDataModel.js";

/**
 * 一時停止データモデル
 */
export class PauseModel extends IDataModel {
  #value = true;

  /**
   * 値を取得
   * @returns {boolean} 一時停止状態
   */
  getValue() {
    return structuredClone(this.#value);
  }

  /**
   * 値を設定
   * @param {boolean} value - 一時停止状態
   */
  setValue(value) {
    if (this.validate(value)) {
      this.#value = value;
    }
  }

  /**
   * 値を検証
   * @param {boolean} value - 検証する値
   * @returns {boolean} 検証結果
   */
  validate(value) {
    return typeof value === "boolean";
  }
}
