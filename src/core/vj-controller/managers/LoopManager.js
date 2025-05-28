import { ILoopManager } from "../interfaces/ILoopManager.js";

/**
 * ループ管理の実装
 */
export class LoopManager extends ILoopManager {
  #dataManager;
  #onSetData;

  /**
   * @param {Object} dataManager - データマネージャー
   * @param {Function} onSetData - データ設定コールバック
   */
  constructor(dataManager, onSetData) {
    super();
    this.#dataManager = dataManager;
    this.#onSetData = onSetData;
  }

  /**
   * ループ開始点を設定
   * @param {number} time - 開始時間
   */
  setLoopStart(time) {
    const loop = this.#dataManager.loop;
    loop.start = time;
    this.#onSetData("loop", loop);
  }

  /**
   * ループ終了点を設定
   * @param {number} time - 終了時間
   */
  setLoopEnd(time) {
    const loop = this.#dataManager.loop;
    loop.end = time;
    this.#onSetData("loop", loop);
  }

  /**
   * ループをクリア
   */
  clearLoop() {
    const loop = this.#dataManager.loop;
    loop.start = -1;
    loop.end = -1;
    this.#onSetData("loop", loop);
  }
}
