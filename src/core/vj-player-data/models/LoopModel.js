import { IDataModel } from "../interfaces/IDataModel.js";

/**
 * ループデータモデル
 */
export class LoopModel extends IDataModel {
  #value = {
    start: -1,
    end: -1,
  };

  /**
   * 値を取得
   * @returns {Object} ループ値
   */
  getValue() {
    return structuredClone(this.#value);
  }

  /**
   * 値を設定
   * @param {Object} value - ループ値
   */
  setValue(value) {
    if (this.validate(value)) {
      this.#value = value;
    }
  }

  /**
   * 値を検証
   * @param {Object} value - 検証する値
   * @returns {boolean} 検証結果
   */
  validate(value) {
    return (
      typeof value === "object" &&
      value !== null &&
      typeof value.start === "number" &&
      typeof value.end === "number"
    );
  }

  /**
   * ループが有効かどうか
   * @returns {boolean} ループ有効フラグ
   */
  isActive() {
    return this.#value.start < this.#value.end;
  }
}
