/**
 * YouTube Playerラッパーのインターフェース
 */
export class IYouTubePlayerWrapper {
  /**
   * プレイヤーを初期化
   * @param {string} elementId - プレイヤー要素のID
   * @param {Object} config - プレイヤー設定
   */
  initialize(elementId, config) {
    throw new Error("Method 'initialize' must be implemented");
  }

  /**
   * 動画を読み込み
   * @param {string} videoId - 動画ID
   */
  loadVideo(videoId) {
    throw new Error("Method 'loadVideo' must be implemented");
  }

  /**
   * 再生
   */
  play() {
    throw new Error("Method 'play' must be implemented");
  }

  /**
   * 動画再生
   */
  playVideo() {
    throw new Error("Method 'playVideo' must be implemented");
  }

  /**
   * 一時停止
   */
  pause() {
    throw new Error("Method 'pause' must be implemented");
  }

  /**
   * 動画一時停止
   */
  pauseVideo() {
    throw new Error("Method 'pauseVideo' must be implemented");
  }

  /**
   * プレイヤー状態取得
   * @returns {number} プレイヤー状態
   */
  getPlayerState() {
    throw new Error("Method 'getPlayerState' must be implemented");
  }

  /**
   * ミュート
   */
  mute() {
    throw new Error("Method 'mute' must be implemented");
  }

  /**
   * ミュート解除
   */
  unMute() {
    throw new Error("Method 'unMute' must be implemented");
  }

  /**
   * ボリューム設定
   * @param {number} volume - ボリューム値（0-100）
   */
  setVolume(volume) {
    throw new Error("Method 'setVolume' must be implemented");
  }

  /**
   * ボリューム取得
   * @returns {number} ボリューム値（0-100）
   */
  getVolume() {
    throw new Error("Method 'getVolume' must be implemented");
  }

  /**
   * シーク
   * @param {number} time - シーク時間
   */
  seekTo(time) {
    throw new Error("Method 'seekTo' must be implemented");
  }

  /**
   * 再生速度設定
   * @param {number} rate - 再生速度
   */
  setPlaybackRate(rate) {
    throw new Error("Method 'setPlaybackRate' must be implemented");
  }

  /**
   * 現在時間取得
   * @returns {number} 現在時間
   */
  getCurrentTime() {
    throw new Error("Method 'getCurrentTime' must be implemented");
  }

  /**
   * 動画長取得
   * @returns {number} 動画長
   */
  getDuration() {
    throw new Error("Method 'getDuration' must be implemented");
  }

  /**
   * iframe取得
   * @returns {HTMLElement} iframe要素
   */
  getIframe() {
    throw new Error("Method 'getIframe' must be implemented");
  }

  /**
   * イベントリスナー追加
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック
   */
  addEventListener(event, callback) {
    throw new Error("Method 'addEventListener' must be implemented");
  }

  /**
   * イベントリスナー削除
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック
   */
  removeEventListener(event, callback) {
    throw new Error("Method 'removeEventListener' must be implemented");
  }
}
