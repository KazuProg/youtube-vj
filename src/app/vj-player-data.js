import { VJPlayerDataManager } from "../core/vj-player-data/index.js";

/**
 * VJPlayerDataのアプリケーション層ファサード
 * EventEmitterを継承して後方互換性を保持
 */
class VJPlayerDataFacade extends EventEmitter {
  #dataManager;

  constructor() {
    super();
    this.#dataManager = new VJPlayerDataManager();

    // イベントの転送
    this.#dataManager.addEventListener("changed", (...args) => {
      this.dispatchEvent("changed", ...args);
    });
  }

  /**
   * 速度を取得
   * @returns {number} 速度
   */
  get speed() {
    return this.#dataManager.speed;
  }

  /**
   * 速度を設定
   * @param {number} value - 速度
   */
  set speed(value) {
    this.#dataManager.speed = value;
  }

  /**
   * フィルターを取得
   * @returns {Object} フィルター
   */
  get filter() {
    return this.#dataManager.filter;
  }

  /**
   * フィルターを設定
   * @param {Object} value - フィルター
   */
  set filter(value) {
    this.#dataManager.filter = value;
  }

  /**
   * 一時停止状態を取得
   * @returns {boolean} 一時停止状態
   */
  get pause() {
    return this.#dataManager.pause;
  }

  /**
   * 一時停止状態を設定
   * @param {boolean} value - 一時停止状態
   */
  set pause(value) {
    this.#dataManager.pause = value;
  }

  /**
   * タイミングを取得
   * @returns {Object} タイミング
   */
  get timing() {
    return this.#dataManager.timing;
  }

  /**
   * タイミングを設定
   * @param {Object} value - タイミング
   */
  set timing(value) {
    this.#dataManager.timing = value;
  }

  /**
   * 動画IDを取得
   * @returns {string|null} 動画ID
   */
  get videoId() {
    return this.#dataManager.videoId;
  }

  /**
   * 動画IDを設定
   * @param {string|null} value - 動画ID
   */
  set videoId(value) {
    this.#dataManager.videoId = value;
  }

  /**
   * ループを取得
   * @returns {Object} ループ
   */
  get loop() {
    return this.#dataManager.loop;
  }

  /**
   * ループを設定
   * @param {Object} value - ループ
   */
  set loop(value) {
    this.#dataManager.loop = value;
  }

  /**
   * ループが有効かどうか
   * @returns {boolean} ループ有効フラグ
   */
  get isLoop() {
    return this.#dataManager.isLoop;
  }

  /**
   * すべてのデータを取得
   * @returns {Object} すべてのデータ
   */
  getAll() {
    return this.#dataManager.getAll();
  }

  /**
   * データを適用
   * @param {Object} data - 適用するデータ
   */
  applyData(data) {
    this.#dataManager.applyData(data);
  }

  /**
   * すべてのデータ変更イベントを発火
   */
  dispatchAll() {
    this.#dataManager.dispatchAll();
  }
}

export default VJPlayerDataFacade;
