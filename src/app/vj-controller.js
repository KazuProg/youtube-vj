import VJPlayer from "./vj-player.js";
import VJPlayerData from "./vj-player-data.js";
import { VJControllerManager } from "../core/vj-controller/index.js";

/**
 * VJControllerのアプリケーション層ファサード
 * EventEmitterを継承して後方互換性を保持
 */
class VJControllerFacade extends EventEmitter {
  #controllerManager;

  constructor(channel, options = {}) {
    super();

    const dataManager = new VJPlayerData();
    const vjPlayer = new VJPlayer(channel, dataManager);

    this.#controllerManager = new VJControllerManager(
      channel,
      vjPlayer,
      dataManager,
      options.localStorageKey
    );

    // イベントの転送
    this.#controllerManager.addEventListener("timeSyncStart", (...args) => {
      this.dispatchEvent("timeSyncStart", ...args);
    });
    this.#controllerManager.addEventListener("timeSyncEnd", (...args) => {
      this.dispatchEvent("timeSyncEnd", ...args);
    });
    this.#controllerManager.addEventListener("dataApplied", (...args) => {
      this.dispatchEvent("dataApplied", ...args);
    });
    this.#controllerManager.addEventListener("changeVideo", (...args) => {
      this.dispatchEvent("changeVideo", ...args);
    });
    this.#controllerManager.addEventListener("suspendPreview", (...args) => {
      this.dispatchEvent("suspendPreview", ...args);
    });
    this.#controllerManager.addEventListener("resumePreview", (...args) => {
      this.dispatchEvent("resumePreview", ...args);
    });
    this.#controllerManager.addEventListener("hotcueAdded", (...args) => {
      this.dispatchEvent("hotcueAdded", ...args);
    });
    this.#controllerManager.addEventListener("hotcueRemoved", (...args) => {
      this.dispatchEvent("hotcueRemoved", ...args);
    });
    this.#controllerManager.addEventListener("muteChange", (...args) => {
      this.dispatchEvent("muteChange", ...args);
    });

    // 初期化処理
    localStorage.removeItem(options.localStorageKey);
    if (options.autoplay) {
      this.#controllerManager.setData("pause", false);
    }
  }

  /**
   * 動画長を取得
   * @returns {number} 動画長
   */
  get duration() {
    return this.#controllerManager.duration;
  }

  /**
   * 現在時間を取得
   * @returns {number} 現在時間
   */
  get currentTime() {
    return this.#controllerManager.getCurrentTime();
  }

  /**
   * チャンネル番号を取得
   * @returns {number} チャンネル番号
   */
  get channelNumber() {
    return this.#controllerManager.channelNumber;
  }

  /**
   * ミュート状態を取得
   * @returns {boolean} ミュート状態
   */
  get isMuted() {
    return this.#controllerManager.audioManager.isMuted;
  }

  /**
   * ミュート状態を設定
   * @param {boolean} val - ミュート状態
   */
  set isMuted(val) {
    this.#controllerManager.audioManager.isMuted = val;
  }

  /**
   * 音量を取得
   * @returns {number} 音量
   */
  get volume() {
    return this.#controllerManager.audioManager.volume;
  }

  /**
   * 音量を設定
   * @param {number} val - 音量
   */
  set volume(val) {
    this.#controllerManager.audioManager.volume = val;
  }

  /**
   * 動画を設定
   * @param {string} id - 動画ID
   */
  setVideo(id) {
    this.#controllerManager.setVideo(id);
  }

  /**
   * 速度を設定
   * @param {number} val - 速度
   * @param {boolean} relative - 相対指定
   */
  setSpeed(val, relative = false) {
    this.#controllerManager.setSpeed(val, relative);
  }

  /**
   * 時間を設定
   * @param {number} sec - 時間（秒）
   */
  setTime(sec) {
    this.#controllerManager.setTime(sec);
  }

  /**
   * フィルターを設定
   * @param {Object} val - フィルター値
   */
  setFilter(val) {
    this.#controllerManager.setFilter(val);
  }

  /**
   * ホットキューを実行
   * @param {number} index - ホットキューインデックス
   */
  hotcue(index) {
    this.#controllerManager.hotcueManager.hotcueWithTime(
      index,
      this.currentTime
    );
  }

  /**
   * ホットキューを追加
   * @param {number} index - ホットキューインデックス
   */
  addHotcue(index) {
    this.#controllerManager.hotcueManager.addHotcue(index, this.currentTime);
  }

  /**
   * ホットキューを再生
   * @param {number} index - ホットキューインデックス
   */
  playHotcue(index) {
    this.#controllerManager.hotcueManager.playHotcue(index);
  }

  /**
   * ホットキューを削除
   * @param {number} index - ホットキューインデックス
   */
  removeHotcue(index) {
    this.#controllerManager.hotcueManager.removeHotcue(index);
  }

  /**
   * プレビューを一時停止
   */
  suspendPreview() {
    this.#controllerManager.suspendPreview();
  }

  /**
   * プレビューを再開
   */
  resumePreview() {
    this.#controllerManager.resumePreview();
  }

  /**
   * タイミングを調整
   * @param {number} sec - 調整秒数
   */
  adjustTiming(sec) {
    this.#controllerManager.adjustTiming(sec);
  }

  /**
   * ループ開始点を設定
   */
  loopStart() {
    this.#controllerManager.loopManager.setLoopStart(this.currentTime);
  }

  /**
   * ループ終了点を設定
   */
  loopEnd() {
    this.#controllerManager.loopManager.setLoopEnd(this.currentTime);
  }

  /**
   * ループをクリア
   */
  loopClear() {
    this.#controllerManager.loopManager.clearLoop();
  }

  /**
   * 再生
   */
  play() {
    this.#controllerManager.play();
  }

  /**
   * 一時停止
   */
  pause() {
    this.#controllerManager.pause();
  }

  /**
   * 再生/一時停止を切り替え
   */
  togglePlayPause() {
    this.#controllerManager.togglePlayPause();
  }

  /**
   * ミュート
   */
  mute() {
    this.isMuted = true;
  }

  /**
   * ミュート解除
   */
  unmute() {
    this.isMuted = false;
  }

  /**
   * ミュート/ミュート解除を切り替え
   */
  toggleMuteUnmute() {
    this.isMuted = !this.isMuted;
  }

  /**
   * 音量を設定
   * @param {number} val - 音量
   */
  setVolume(val) {
    this.volume = val;
  }

  /**
   * フェードアウト
   */
  fadeoutVolume() {
    this.#controllerManager.audioManager.fadeoutVolume();
  }
}

export default VJControllerFacade;
