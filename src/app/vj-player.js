import { createVJPlayer } from "../core/vj-player/index.js";
import { AppConstants } from "./constants.js";

/**
 * VJPlayerのファサードクラス
 * 既存のAPIとの後方互換性を保持
 */
class VJPlayerFacade extends EventEmitter {
  #manager;

  constructor(channel, dataManager, options = {}) {
    super();
    this.#manager = createVJPlayer(dataManager, options);
    this.#manager.initialize(channel, AppConstants.SYNC_INTERVAL);

    // イベントの転送
    this.#setupEventForwarding();
  }

  /**
   * イベント転送を設定
   */
  #setupEventForwarding() {
    const events = [
      "YTPlayerReady",
      "YTPlayerStateChange",
      "YTPlayerPlaybackQualityChange",
      "YTPlayerPlaybackRateChange",
      "YTPlayerError",
      "YTPlayerApiChange",
      "changed",
      "paused",
      "resumed",
      "ended",
      "dataApplied",
      "timeSyncStart",
      "timeSyncEnd",
    ];

    events.forEach((eventName) => {
      this.#manager.addEventListener(eventName, (...args) => {
        this.dispatchEvent(eventName, ...args);
      });
    });
  }

  /**
   * YouTube Playerを取得
   * @returns {Object} YouTube Player
   */
  get YTPlayer() {
    return this.#manager.YTPlayer;
  }

  /**
   * 現在時間を取得
   * @returns {number} 現在時間
   */
  get currentTime() {
    return this.#manager.currentTime;
  }

  /**
   * タイミング同期
   */
  syncTiming() {
    this.#manager.syncTiming();
  }

  /**
   * 同期停止
   */
  stopSync() {
    this.#manager.stopSync();
  }
}

export default VJPlayerFacade;
