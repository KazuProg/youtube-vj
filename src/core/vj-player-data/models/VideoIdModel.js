import { IDataModel } from "../interfaces/IDataModel.js";

/**
 * 動画IDデータモデル
 */
export class VideoIdModel extends IDataModel {
  #value = null;

  /**
   * 値を取得
   * @returns {string|null} 動画ID
   */
  getValue() {
    return structuredClone(this.#value);
  }

  /**
   * 値を設定
   * @param {string|null} value - 動画ID
   */
  setValue(value) {
    if (this.validate(value)) {
      this.#value = value;
    }
  }

  /**
   * 値を検証
   * @param {string|null} value - 検証する値
   * @returns {boolean} 検証結果
   */
  validate(value) {
    return value === null || typeof value === "string";
  }
}
