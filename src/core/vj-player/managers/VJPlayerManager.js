/**
 * VJPlayerの中核管理クラス
 * 各コンポーネントを統合してVJPlayerの機能を管理
 */
export class VJPlayerManager extends EventEmitter {
  #playerWrapper;
  #timeCalculator;
  #timingSynchronizer;
  #filterProcessor;
  #dataManager;
  #options;
  #syncInterval;
  #isInitialized = false;
  #isSuspended = false; // suspend状態を管理
  #isVideoChanging = false;
  #lastStateChangeTime = null;

  /**
   * @param {IYouTubePlayerWrapper} playerWrapper - プレイヤーラッパー
   * @param {ITimeCalculator} timeCalculator - 時間計算器
   * @param {ITimingSynchronizer} timingSynchronizer - タイミング同期器
   * @param {IFilterProcessor} filterProcessor - フィルター処理器
   * @param {Object} dataManager - データマネージャー
   * @param {Object} options - オプション
   */
  constructor(
    playerWrapper,
    timeCalculator,
    timingSynchronizer,
    filterProcessor,
    dataManager,
    options = {}
  ) {
    super();
    this.#playerWrapper = playerWrapper;
    this.#timeCalculator = timeCalculator;
    this.#timingSynchronizer = timingSynchronizer;
    this.#filterProcessor = filterProcessor;
    this.#dataManager = dataManager;
    this.#options = {
      isProjection: false,
      ...options,
    };
  }

  /**
   * 初期化
   * @param {number} channel - チャンネル番号
   * @param {number} syncInterval - 同期間隔
   */
  initialize(channel, syncInterval) {
    const playerId = `vj_player_ch${channel}`;

    const playerConfig = {
      videoId: "BLeUas72Mzk", //【フリー動画素材】ローディング動画4秒【ダウンロード可能】
      events: {
        onReady: (event) => {
          this.#onPlayerReady(event);
        },
        onStateChange: (event) => {
          this.#onPlayerStateChange(event);
        },
        onPlaybackQualityChange: (event) => {
          this.dispatchEvent("YTPlayerPlaybackQualityChange", event);
        },
        onPlaybackRateChange: (event) => {
          this.dispatchEvent("YTPlayerPlaybackRateChange", event);
        },
        onError: (event) => {
          this.dispatchEvent("YTPlayerError", event);
        },
        onApiChange: (event) => {
          this.dispatchEvent("YTPlayerApiChange", event);
        },
      },
      playerVars: {
        controls: 0,
        disablekb: this.#options.isProjection ? 0 : 1,
        iv_load_policy: 3, // アノテーション無効
      },
    };

    this.#playerWrapper.initialize(playerId, playerConfig);
    this.#syncInterval = syncInterval;
  }

  /**
   * YouTube Playerを取得
   * @returns {Object} YouTube Player
   */
  get YTPlayer() {
    return this.#playerWrapper;
  }

  /**
   * 現在時間を取得
   * @returns {number} 現在時間
   */
  get currentTime() {
    return this.#timeCalculator.calculateCurrentTime(this.#dataManager);
  }

  /**
   * タイミング同期
   */
  syncTiming() {
    if (this.#isSuspended) {
      return;
    }
    this.#timingSynchronizer.startSync(
      this.#playerWrapper,
      this.#dataManager,
      this.#timeCalculator,
      () => this.dispatchEvent("timeSyncStart"),
      () => this.dispatchEvent("timeSyncEnd")
    );
  }

  /**
   * 同期停止
   */
  stopSync() {
    this.#timingSynchronizer.stopSync();
  }

  /**
   * suspend状態を設定
   * @param {boolean} suspended - suspend状態
   */
  setSuspended(suspended) {
    this.#isSuspended = suspended;
  }

  /**
   * suspend状態を取得
   * @returns {boolean} suspend状態
   */
  get isSuspended() {
    return this.#isSuspended;
  }

  /**
   * プレイヤー準備完了時の処理
   * @param {Object} event - イベント
   */
  #onPlayerReady(event) {
    this.#playerWrapper.mute();

    this.#dataManager.addEventListener(
      "changed",
      this.#onDataChanged.bind(this)
    );

    this.#dataManager.dispatchAll();

    setInterval(() => {
      if (this.#isSuspended) {
        // suspend中は同期処理をスキップ
        return;
      }
      if (this.#playerWrapper.getPlayerState() === YT.PlayerState.PLAYING) {
        this.syncTiming();
      }
    }, this.#syncInterval);

    const loop = () => {
      // ループ処理を呼び出すため
      this.currentTime;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    this.dispatchEvent("YTPlayerReady", event);
    this.#isInitialized = true;
  }

  /**
   * データ変更時の処理
   * @param {string} key - 変更されたキー
   * @param {*} value - 新しい値
   * @param {Object} data - データ全体
   */
  #onDataChanged(key, value, data) {
    // suspend中は特定の処理をスキップ（videoIdは除く）
    if (this.#isSuspended && (key === "pause" || key === "timing" || key === "speed")) {
      return;
    }
    
    switch (key) {
      case "videoId":
        this.#isVideoChanging = true;
        this.#playerWrapper.loadVideo(value);
        // 動画ロード完了を待つ
        setTimeout(() => {
          this.#isVideoChanging = false;
        }, 2000);
        break;
      case "pause":
        if (value === true) {
          this.#dataManager.timing.playerTime = this.currentTime;
          this.#playerWrapper.pause();
        } else {
          this.#dataManager.timing.timestamp = new Date() / 1000;
          this.#playerWrapper.play();
        }
        break;
      case "timing":
      case "speed":
        if (this.#dataManager.pause) {
          if (this.#isInitialized === false) {
            console.warn(`[VJPlayerManager] Player is not ready yet, cannot seek.`);
            return;
          }
          // currentTimeが有効な値の場合のみシーク
          if (typeof this.currentTime === 'number' && !isNaN(this.currentTime)) {
            this.#playerWrapper.seekTo(this.currentTime);
          }
          return;
        } else {
          this.syncTiming();
        }
        break;
      case "filter":
        if (this.#options.isProjection) {
          this.#filterProcessor.applyFilter(
            this.#playerWrapper.getIframe(),
            value
          );
        }
        break;
      case "zIndex":
        if (this.#options.isProjection) {
          this.#filterProcessor.setZIndex(
            this.#playerWrapper.getIframe(),
            value
          );
        }
        break;
      case "loop":
        break;
      default:
        console.warn(`YTVJ:P Unsupported ${key}`);
        return;
    }

    if (this.#isInitialized) {
      this.dispatchEvent("dataApplied", key, value);
    }
  }

  /**
   * プレイヤー状態変更時の処理
   * @param {Object} event - イベント
   */
  #onPlayerStateChange(event) {
    const state = event.data;

    // 動画ロード中は状態変更を無視
    if (this.#isVideoChanging) {
      return;
    }

    if (state === YT.PlayerState.UNSTARTED) {
      this.dispatchEvent("changed");
      return;
    }

    if (state === YT.PlayerState.PAUSED && this.#dataManager.pause === false) {
      this.dispatchEvent("paused");
      if (this.#dataManager.pause === false && !this.#isSuspended) {
        event.target.playVideo();
      }
      return;
    }

    if (state === YT.PlayerState.PLAYING && this.#dataManager.pause === true) {
      this.dispatchEvent("resumed");
      return;
    }

    if (state === YT.PlayerState.ENDED) {
      this.dispatchEvent("ended");
      return;
    }

    if (state === YT.PlayerState.PLAYING) {
      if (this.#dataManager.pause) {
        this.#playerWrapper.pause();
        return;
      }
      if (this.#options.isProjection && !this.#isSuspended) {
        // 再生開始直後は同期をスキップ
        if (this.#lastStateChangeTime && Date.now() - this.#lastStateChangeTime < 1000) {
          return;
        }
        this.syncTiming();
      }
    }

    this.#lastStateChangeTime = Date.now();
    this.dispatchEvent("YTPlayerStateChange", event);
  }
}
