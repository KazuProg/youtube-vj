import { IYouTubePlayerWrapper } from "../interfaces/IYouTubePlayerWrapper.js";

/**
 * YouTube Playerラッパーの実装
 */
export class YouTubePlayerWrapper extends IYouTubePlayerWrapper {
  #player;
  #eventListeners = new Map();

  /**
   * プレイヤーを初期化
   * @param {string} elementId - プレイヤー要素のID
   * @param {Object} config - プレイヤー設定
   */
  initialize(elementId, config) {
    this.#player = new YT.Player(document.getElementById(elementId), config);
  }

  /**
   * 動画を読み込み
   * @param {string} videoId - 動画ID
   */
  loadVideo(videoId) {
    this.#player.loadVideoById(videoId);
  }

  /**
   * 再生
   */
  play() {
    this.#player.playVideo();
  }

  /**
   * 動画再生
   */
  playVideo() {
    this.#player.playVideo();
  }

  /**
   * 一時停止
   */
  pause() {
    this.#player.pauseVideo();
  }

  /**
   * 動画一時停止
   */
  pauseVideo() {
    this.#player.pauseVideo();
  }

  /**
   * プレイヤー状態取得
   * @returns {number} プレイヤー状態
   */
  getPlayerState() {
    return this.#player.getPlayerState();
  }

  /**
   * ミュート
   */
  mute() {
    this.#player.mute();
  }

  /**
   * ミュート解除
   */
  unMute() {
    this.#player.unMute();
  }

  /**
   * ボリューム設定
   * @param {number} volume - ボリューム値（0-100）
   */
  setVolume(volume) {
    this.#player.setVolume(volume);
  }

  /**
   * ボリューム取得
   * @returns {number} ボリューム値（0-100）
   */
  getVolume() {
    return this.#player.getVolume();
  }

  /**
   * 指定時間にシーク
   * @param {number} time - シーク時間
   */
  seekTo(time) {
    if (this.#player && this.#player.seekTo) {
      this.#player.seekTo(time, true);
    }
  }

  /**
   * 再生速度設定
   * @param {number} rate - 再生速度
   */
  setPlaybackRate(rate) {
    this.#player.setPlaybackRate(rate);
  }

  /**
   * 現在時間取得
   * @returns {number} 現在時間
   */
  getCurrentTime() {
    return this.#player.getCurrentTime();
  }

  /**
   * 動画長取得
   * @returns {number} 動画長
   */
  getDuration() {
    return this.#player.getDuration();
  }

  /**
   * iframe取得
   * @returns {HTMLElement} iframe要素
   */
  getIframe() {
    return this.#player.getIframe();
  }

  /**
   * イベントリスナー追加
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
   * イベントリスナー削除
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック
   */
  removeEventListener(event, callback) {
    if (this.#eventListeners.has(event)) {
      this.#eventListeners.get(event).delete(callback);
    }
  }

  /**
   * イベントを発火
   * @param {string} event - イベント名
   * @param {*} data - イベントデータ
   */
  dispatchEvent(event, data) {
    if (this.#eventListeners.has(event)) {
      this.#eventListeners.get(event).forEach((callback) => {
        callback(data);
      });
    }
  }
}
