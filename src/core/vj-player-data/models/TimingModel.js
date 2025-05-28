import { IDataModel } from "../interfaces/IDataModel.js";

/**
 * タイミングデータモデル
 */
export class TimingModel extends IDataModel {
  #value = {
    timestamp: 0,
    playerTime: 0,
  };

  /**
   * 値を取得
   * @returns {Object} タイミング値
   */
  getValue() {
    return structuredClone(this.#value);
  }

  /**
   * 値を設定
   * @param {Object} value - タイミング値
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
      typeof value.timestamp === "number" &&
      typeof value.playerTime === "number"
    );
  }
}
