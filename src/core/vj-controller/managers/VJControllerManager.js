import { AudioManager } from "./AudioManager.js";
import { HotcueManager } from "./HotcueManager.js";
import { LoopManager } from "./LoopManager.js";
import { DataSyncService } from "../services/DataSyncService.js";
import { VJPlayerEventHandler } from "../handlers/VJPlayerEventHandler.js";

/**
 * VJControllerの中核管理クラス
 */
export class VJControllerManager extends EventEmitter {
  #channel;
  #vjPlayer;
  #dataManager;
  #audioManager;
  #hotcueManager;
  #loopManager;
  #dataSyncService;
  #eventHandler;
  #localStorageKey;

  /**
   * @param {number} channel - チャンネル番号
   * @param {Object} vjPlayer - VJPlayer
   * @param {Object} dataManager - データマネージャー
   * @param {string} localStorageKey - LocalStorageキー
   */
  constructor(channel, vjPlayer, dataManager, localStorageKey) {
    super();
    this.#channel = channel;
    this.#vjPlayer = vjPlayer;
    this.#dataManager = dataManager;
    this.#localStorageKey = localStorageKey;

    this.#initializeManagers();
    this.#setupEventHandlers();
  }

  /**
   * マネージャーを初期化
   */
  #initializeManagers() {
    // 音量管理
    this.#audioManager = new AudioManager(this.#vjPlayer.YTPlayer, (isMuted) =>
      this.dispatchEvent("muteChange", this.#channel, isMuted)
    );

    // ホットキュー管理（setTimeは後で設定）
    this.#hotcueManager = new HotcueManager(
      (index, time) =>
        this.dispatchEvent("hotcueAdded", this.#channel, index, time),
      (index) => this.dispatchEvent("hotcueRemoved", this.#channel, index),
      null // 後で設定
    );

    // データ同期サービス（getCurrentTimeの循環参照を避けるため）
    this.#dataSyncService = new DataSyncService(
      this.#dataManager,
      this.#localStorageKey,
      () => this.#calculateCurrentTime()
    );

    // ホットキューのsetTimeコールバックを設定
    this.#hotcueManager = new HotcueManager(
      (index, time) =>
        this.dispatchEvent("hotcueAdded", this.#channel, index, time),
      (index) => this.dispatchEvent("hotcueRemoved", this.#channel, index),
      (time) => this.setTime(time)
    );

    // ループ管理
    this.#loopManager = new LoopManager(this.#dataManager, (key, value) =>
      this.#dataSyncService.setData(key, value)
    );

    // イベントハンドラー
    this.#eventHandler = new VJPlayerEventHandler(
      this.#dataSyncService,
      (event, ...args) => this.#handleInternalEvent(event, ...args),
      this.#channel
    );
  }

  /**
   * イベントハンドラーを設定
   */
  #setupEventHandlers() {
    this.#vjPlayer.addEventListener(
      "YTPlayerStateChange",
      this.#eventHandler.onYTPlayerStateChange.bind(this.#eventHandler)
    );
    this.#vjPlayer.addEventListener("timeSyncStart", () => {
      this.dispatchEvent("timeSyncStart", this.#channel);
    });
    this.#vjPlayer.addEventListener("timeSyncEnd", () => {
      this.dispatchEvent("timeSyncEnd", this.#channel);
    });
    this.#vjPlayer.addEventListener("dataApplied", (key, val) => {
      this.dispatchEvent("dataApplied", this.#channel, key, val);
    });
    this.#vjPlayer.addEventListener(
      "changed",
      this.#eventHandler.onChanged.bind(this.#eventHandler)
    );
    this.#vjPlayer.addEventListener(
      "paused",
      this.#eventHandler.onPaused.bind(this.#eventHandler)
    );
    this.#vjPlayer.addEventListener(
      "resumed",
      this.#eventHandler.onResumed.bind(this.#eventHandler)
    );
    this.#vjPlayer.addEventListener(
      "ended",
      this.#eventHandler.onEnded.bind(this.#eventHandler)
    );
  }

  /**
   * 内部イベントを処理
   * @param {string} event - イベント名
   * @param {...*} args - イベント引数
   */
  #handleInternalEvent(event, ...args) {
    switch (event) {
      case "resumePreview":
        this.dispatchEvent("resumePreview", ...args);
        break;
      case "forcePause":
        // suspend中に再生が始まった場合の強制一時停止
        if (this.#eventHandler.isSuspendPreview) {
          this.#vjPlayer.YTPlayer.pauseVideo();
        }
        break;
      case "syncTiming":
        this.#vjPlayer.syncTiming();
        break;
      case "videoIdChanged":
        const videoId = this.#dataManager.videoId;
        if (videoId) {
          this.dispatchEvent("changeVideo", this.#channel, videoId);
        }
        break;
    }
  }

  /**
   * 動画長を取得
   * @returns {number} 動画長
   */
  get duration() {
    return this.#vjPlayer.YTPlayer.getDuration();
  }

  /**
   * 現在時間を計算（内部用）
   * @returns {number} 現在時間
   */
  #calculateCurrentTime() {
    const paused = this.#dataManager.pause;
    if (this.#eventHandler && this.#eventHandler.isSuspendPreview && !paused) {
      const timing = this.#dataManager.timing;
      const speed = this.#dataManager.speed;

      if (timing.timestamp == 0) return 0;

      const elapsed = +new Date() / 1000 - timing.timestamp;
      const current = timing.playerTime + elapsed * speed;

      const duration = current % this.duration;

      return duration;
    } else {
      return this.#vjPlayer.currentTime % this.duration;
    }
  }

  /**
   * 現在時間を取得
   * @returns {number} 現在時間
   */
  getCurrentTime() {
    return this.#calculateCurrentTime();
  }

  /**
   * チャンネル番号を取得
   * @returns {number} チャンネル番号
   */
  get channelNumber() {
    return this.#channel;
  }

  /**
   * 音量管理を取得
   * @returns {AudioManager} 音量管理
   */
  get audioManager() {
    return this.#audioManager;
  }

  /**
   * ホットキュー管理を取得
   * @returns {HotcueManager} ホットキュー管理
   */
  get hotcueManager() {
    return this.#hotcueManager;
  }

  /**
   * ループ管理を取得
   * @returns {LoopManager} ループ管理
   */
  get loopManager() {
    return this.#loopManager;
  }

  /**
   * 動画を設定
   * @param {string} id - 動画ID
   */
  setVideo(id) {
    let targetTime = null;
    if (id.indexOf("@") !== -1) {
      targetTime = parseInt(id.split("@")[1]);
      id = id.split("@")[0];
    }
    this.#eventHandler.setTargetTime(targetTime);
    this.#dataSyncService.setData("videoId", id);
    this.setTime(0);
    this.#hotcueManager.clearAllHotcues();
  }

  /**
   * 速度を設定
   * @param {number} val - 速度
   * @param {boolean} relative - 相対指定
   */
  setSpeed(val, relative = false) {
    if (relative) {
      val = this.#dataManager.speed + val;
    }

    if (val < 0.25) val = 0.25;
    if (2 < val) val = 2;

    this.#dataSyncService.setData("speed", val);
  }

  /**
   * 時間を設定
   * @param {number} sec - 時間（秒）
   */
  setTime(sec) {
    this.#dataSyncService.setData("timing", {
      timestamp: new Date() / 1000,
      playerTime: sec,
    });
  }

  /**
   * フィルターを設定
   * @param {Object} val - フィルター値
   */
  setFilter(val) {
    const value = {
      ...this.#dataManager.filter,
      ...val,
    };
    this.#dataSyncService.setData("filter", value);
  }

  /**
   * タイミングを調整
   * @param {number} seconds - 調整秒数
   */
  adjustTiming(seconds) {
    console.log(`[VJControllerManager] ============= Adjusting timing by ${seconds} seconds =============`);
    
    const timing = this.#dataManager.timing;
    console.log("[VJControllerManager] Current timing:", {
      timestamp: timing.timestamp,
      playerTime: timing.playerTime,
      formatted: new Date(timing.timestamp * 1000).toISOString()
    });
    
    // プレビュー画面の現在の再生位置を記録
    const previewPlayer = this.#vjPlayer.YTPlayer;
    const previewCurrentTime = previewPlayer ? previewPlayer.getCurrentTime() : null;
    console.log("[VJControllerManager] Preview player current time BEFORE adjustment:", previewCurrentTime);
    
    // 現在の計算上の時間を取得
    const currentCalculatedTime = this.#calculateCurrentTime();
    console.log("[VJControllerManager] Current calculated time:", currentCalculatedTime);
    
    // 新しい時間を計算（調整値を加算）
    const newPlayerTime = currentCalculatedTime + seconds;
    console.log("[VJControllerManager] New player time after adjustment:", newPlayerTime);
    
    // 新しいタイムスタンプを生成して、時間の整合性を保つ
    const newTimestamp = new Date() / 1000;
    const newTiming = {
      timestamp: newTimestamp,
      playerTime: newPlayerTime
    };
    
    console.log("[VJControllerManager] New timing to set:", {
      timestamp: newTiming.timestamp,
      playerTime: newTiming.playerTime,
      formatted: new Date(newTiming.timestamp * 1000).toISOString(),
      note: "New timestamp generated for accurate timing"
    });
    
    // timingを更新
    this.#dataSyncService.setData("timing", newTiming);
    
    // データが実際に更新されたか確認
    setTimeout(() => {
      const updatedTiming = this.#dataManager.timing;
      console.log("[VJControllerManager] Updated timing in dataManager:", {
        timestamp: updatedTiming.timestamp,
        playerTime: updatedTiming.playerTime,
        formatted: new Date(updatedTiming.timestamp * 1000).toISOString()
      });
      
      // プレビュー画面のプレイヤーにも新しい位置を反映
      if (previewPlayer && previewPlayer.seekTo) {
        console.log("[VJControllerManager] Seeking preview player to", newPlayerTime);
        previewPlayer.seekTo(newPlayerTime, true);
        
        // シーク後の実際の位置を確認
        setTimeout(() => {
          const actualTime = previewPlayer.getCurrentTime();
          console.log("[VJControllerManager] After seek - Preview player actual time:", actualTime);
          console.log("[VJControllerManager] Seek difference:", Math.abs(actualTime - newPlayerTime));
        }, 100);
      } else {
        console.log("[VJControllerManager] Preview player not available");
      }
      
      // LocalStorage の内容も確認
      const localStorageData = JSON.parse(localStorage.getItem(this.#localStorageKey) || '{}');
      console.log("[VJControllerManager] Timing in localStorage:", localStorageData.timing);
      
      console.log("[VJControllerManager] ============= Timing adjustment completed =============");
    }, 50);
  }

  /**
   * プレビューを一時停止
   */
  suspendPreview() {
    if (!this.#eventHandler.isSuspendPreview) {
      this.dispatchEvent("suspendPreview", this.#channel);
      this.#eventHandler.setSuspendPreview(true);
    }
    
    // VJPlayerの同期処理を停止
    this.#vjPlayer.setSuspended(true);
    this.#vjPlayer.stopSync();
    this.#vjPlayer.YTPlayer.pauseVideo();
  }

  /**
   * プレビューを再開
   */
  resumePreview() {
    if (this.#eventHandler.isSuspendPreview) {
      this.#eventHandler.setSuspendPreview(false);
      
      // VJPlayerの同期処理を再開
      this.#vjPlayer.setSuspended(false);
      
      this.dispatchEvent("resumePreview", this.#channel);
      this.#vjPlayer.YTPlayer.playVideo();
    }
  }

  /**
   * 再生
   */
  play() {
    this.#vjPlayer.YTPlayer.playVideo();
  }

  /**
   * 一時停止
   */
  pause() {
    this.#vjPlayer.YTPlayer.pauseVideo();
  }

  /**
   * データを設定（内部用）
   * @param {string} key - キー
   * @param {*} value - 値
   */
  setData(key, value) {
    this.#dataSyncService.setData(key, value);
  }

  /**
   * 再生/一時停止を切り替え
   */
  togglePlayPause() {
    if (this.#vjPlayer.YTPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
      this.pause();
    } else {
      this.play();
    }
  }
}
