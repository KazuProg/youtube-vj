import { IDataManager } from "../interfaces/IDataManager.js";
import { SpeedModel } from "../models/SpeedModel.js";
import { FilterModel } from "../models/FilterModel.js";
import { PauseModel } from "../models/PauseModel.js";
import { TimingModel } from "../models/TimingModel.js";
import { VideoIdModel } from "../models/VideoIdModel.js";
import { LoopModel } from "../models/LoopModel.js";

/**
 * VJPlayerDataの中核管理クラス
 */
export class VJPlayerDataManager extends IDataManager {
  #speedModel;
  #filterModel;
  #pauseModel;
  #timingModel;
  #videoIdModel;
  #loopModel;
  #eventListeners = new Map();

  constructor() {
    super();
    this.#speedModel = new SpeedModel();
    this.#filterModel = new FilterModel();
    this.#pauseModel = new PauseModel();
    this.#timingModel = new TimingModel();
    this.#videoIdModel = new VideoIdModel();
    this.#loopModel = new LoopModel();
  }

  /**
   * 速度を取得
   * @returns {number} 速度
   */
  get speed() {
    return this.#speedModel.getValue();
  }

  /**
   * 速度を設定
   * @param {number} value - 速度
   */
  set speed(value) {
    this.#speedModel.setValue(value);
    this.#dispatchEvent("changed", "speed", value, this.getAll());
  }

  /**
   * フィルターを取得
   * @returns {Object} フィルター
   */
  get filter() {
    return this.#filterModel.getValue();
  }

  /**
   * フィルターを設定
   * @param {Object} value - フィルター
   */
  set filter(value) {
    this.#filterModel.setValue(value);
    this.#dispatchEvent("changed", "filter", value, this.getAll());
  }

  /**
   * 一時停止状態を取得
   * @returns {boolean} 一時停止状態
   */
  get pause() {
    return this.#pauseModel.getValue();
  }

  /**
   * 一時停止状態を設定
   * @param {boolean} value - 一時停止状態
   */
  set pause(value) {
    this.#pauseModel.setValue(value);
    this.#dispatchEvent("changed", "pause", value, this.getAll());
  }

  /**
   * タイミングを取得
   * @returns {Object} タイミング
   */
  get timing() {
    return this.#timingModel.getValue();
  }

  /**
   * タイミングを設定
   * @param {Object} value - タイミング
   */
  set timing(value) {
    this.#timingModel.setValue(value);
    this.#dispatchEvent("changed", "timing", value, this.getAll());
  }

  /**
   * 動画IDを取得
   * @returns {string|null} 動画ID
   */
  get videoId() {
    return this.#videoIdModel.getValue();
  }

  /**
   * 動画IDを設定
   * @param {string|null} value - 動画ID
   */
  set videoId(value) {
    this.#videoIdModel.setValue(value);
    this.#dispatchEvent("changed", "videoId", value, this.getAll());
  }

  /**
   * ループを取得
   * @returns {Object} ループ
   */
  get loop() {
    return this.#loopModel.getValue();
  }

  /**
   * ループを設定
   * @param {Object} value - ループ
   */
  set loop(value) {
    this.#loopModel.setValue(value);
    this.#dispatchEvent("changed", "loop", value, this.getAll());
  }

  /**
   * ループが有効かどうか
   * @returns {boolean} ループ有効フラグ
   */
  get isLoop() {
    return this.#loopModel.isActive();
  }

  /**
   * すべてのデータを取得
   * @returns {Object} すべてのデータ
   */
  getAll() {
    return {
      speed: this.speed,
      filter: this.filter,
      pause: this.pause,
      timing: this.timing,
      videoId: this.videoId,
      loop: this.loop,
    };
  }

  /**
   * データを適用
   * @param {Object} data - 適用するデータ
   */
  applyData(data) {
    for (const key in data) {
      if (!(key in this)) {
        console.warn(`${key} is not a valid property`);
        continue;
      }
      if (JSON.stringify(this[key]) === JSON.stringify(data[key])) continue;
      this[key] = data[key];
    }
  }

  /**
   * すべてのデータ変更イベントを発火
   */
  dispatchAll() {
    const data = this.getAll();
    for (const key in data) {
      this.#dispatchEvent("changed", key, data[key], data);
    }
  }

  /**
   * イベントリスナーを追加
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック
   */
  addEventListener(event, callback) {
    if (!this.#eventListeners.has(event)) {
      this.#eventListeners.set(event, new Set());
    }
    this.#eventListeners.get(event).add(callback);
  }

  /**
   * イベントを発火
   * @param {string} event - イベント名
   * @param {...*} args - イベント引数
   */
  #dispatchEvent(event, ...args) {
    if (this.#eventListeners.has(event)) {
      this.#eventListeners.get(event).forEach((callback) => {
        callback(...args);
      });
    }
  }
}
