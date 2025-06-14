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
  #currentTime = 0;
  #eventHandler;
  #dataSyncService;
  #pendingTiming = null;

  /**
   * @param {IYouTubePlayerWrapper} playerWrapper - プレイヤーラッパー
   * @param {ITimeCalculator} timeCalculator - 時間計算器
   * @param {ITimingSynchronizer} timingSynchronizer - タイミング同期器
   * @param {IFilterProcessor} filterProcessor - フィルター処理器
   * @param {Object} dataManager - データマネージャー
   * @param {Object} options - オプション
   * @param {Object} eventHandler - イベントハンドラー
   * @param {Object} dataSyncService - データ同期サービス
   */
  constructor(
    playerWrapper,
    timeCalculator,
    timingSynchronizer,
    filterProcessor,
    dataManager,
    options = {},
    eventHandler,
    dataSyncService
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
    this.#eventHandler = eventHandler;
    this.#dataSyncService = dataSyncService;
    this.#isInitialized = false;
    this.#isSuspended = false;
    this.#isVideoChanging = false;
    this.#currentTime = 0;
    this.#pendingTiming = null;
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
    this.#isInitialized = true;
    this.#isVideoChanging = false;
    
    // 投影ウィンドウの場合はミュート
    if (this.#options.isProjection) {
      this.#playerWrapper.mute();
    }
    
    // 初期状態の設定
    if (this.#dataManager.pause) {
      this.#playerWrapper.pause();
    }
    
    // 初期位置へのシーク
    const timing = this.#pendingTiming || this.#dataManager.timing;
    if (timing && typeof timing.playerTime === 'number') {
      this.#playerWrapper.seekTo(timing.playerTime, true);
      this.#currentTime = timing.playerTime;
      this.#pendingTiming = null;
    }

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
      
      // 投影画面でのみ定期同期を実行
      if (this.#options.isProjection && this.#playerWrapper.getPlayerState() === YT.PlayerState.PLAYING) {
        // 動画変更中は定期同期をスキップ
        if (this.#isVideoChanging) {
          return;
        }
        
        // 同期オフセットが大きい場合のみ同期を実行
        const currentPlayerTime = this.#playerWrapper.getCurrentTime();
        const expectedTime = this.#timeCalculator.calculateCurrentTime(this.#dataManager);
        const syncOffset = Math.abs(expectedTime - currentPlayerTime);
        
        if (syncOffset > 2.5) {
          this.syncTiming();
        }
      }
    }, this.#syncInterval * 3); // 頻度を1/3に削減

    const loop = () => {
      // ループ処理を呼び出すため
      this.currentTime;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    this.dispatchEvent("YTPlayerReady", event);
  }

  /**
   * データ変更時の処理
   * @param {string} key - 変更されたキー
   * @param {*} value - 新しい値
   * @param {Object} data - データ全体
   */
  #onDataChanged(key, value) {
    if (this.#isSuspended && ["pause", "timing", "speed"].includes(key)) {
      return;
    }

    switch (key) {
      case "videoId":
        this.#isInitialized = false;
        this.#currentTime = 0;
        this.loadVideo(value);
        break;

      case "pause":
        if (value) {
          this.#playerWrapper.pause();
        } else {
          this.#playerWrapper.play();
        }
        break;

      case "timing":
        // プレイヤーラッパーが利用可能かチェック
        if (!this.#playerWrapper) {
          this.#pendingTiming = value;
          return;
        }
        
        // 初期化されていない場合でも、プレイヤーが存在すれば基本的なシーク処理を実行
        if (!this.#isInitialized) {
          this.#pendingTiming = value;
          
          // 基本的なシーク処理のみ実行
          try {
            this.#playerWrapper.seekTo(value.playerTime, true);
            this.#currentTime = value.playerTime;
          } catch (error) {
            console.error("[VJPlayerManager] Basic seek failed:", error);
          }
          return;
        }

        // 一時停止状態を保存
        const wasPaused = this.isPaused;
        
        // シーク前に一時停止（コントローラー画面のみ）
        if (!wasPaused && !this.#options.isProjection) {
          this.#playerWrapper.pause();
        }

        // 再生位置を更新
        this.#currentTime = value.playerTime;
        
        // YouTube プレイヤーにシーク実行
        this.#playerWrapper.seekTo(value.playerTime, true);
        
        // コントローラー画面では同期処理を完全に無効化
        if (this.#options.isProjection && !this.#isSuspended) {
          // 投影画面では同期オフセットが大きい場合のみ同期処理を実行
          const currentPlayerTime = this.#playerWrapper.getCurrentTime();
          const expectedTime = this.#timeCalculator.calculateCurrentTime(this.#dataManager);
          const syncOffset = Math.abs(expectedTime - currentPlayerTime);
          
          // 同期オフセットが2秒以上の場合のみ同期を実行（閾値を上げて安定性向上）
          if (syncOffset > 2.0) {
            this.syncTiming();
          }
        }
        
        // 元の再生状態に戻す（コントローラー画面のみ）
        if (!wasPaused && !this.#options.isProjection) {
          setTimeout(() => {
            this.#playerWrapper.play();
            // 一時停止状態を解除
            this.#dataManager.pause = false;
          }, 50);
        }
        break;

      case "speed":
        this.setSpeed(value);
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
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        this.#isVideoChanging = false;
        // 再生開始時に現在の再生位置を確認
        const currentTime = this.#playerWrapper.getCurrentTime();
        if (Math.abs(this.#currentTime - currentTime) > 0.1) {
          this.#currentTime = currentTime;
        }
        break;
        
      case YT.PlayerState.PAUSED:
        // シークによる一時停止の場合は再生を再開
        if (!this.#dataManager.pause) {
          this.#playerWrapper.play();
        }
        break;
        
      case YT.PlayerState.ENDED:
        break;
        
      case YT.PlayerState.BUFFERING:
        // バッファリング中は位置維持を行わない（不安定の原因）
        break;
    }

    // 動画ロード中は状態変更を無視
    if (this.#isVideoChanging) {
      return;
    }

    if (event.data === YT.PlayerState.UNSTARTED) {
      this.dispatchEvent("changed");
      return;
    }

    if (event.data === YT.PlayerState.PAUSED && this.#dataManager.pause === false) {
      this.dispatchEvent("paused");
      if (this.#dataManager.pause === false && !this.#isSuspended) {
        event.target.playVideo();
      }
      return;
    }

    if (event.data === YT.PlayerState.PLAYING && this.#dataManager.pause === true) {
      this.dispatchEvent("resumed");
      return;
    }

    if (event.data === YT.PlayerState.PLAYING) {
      if (this.#dataManager.pause) {
        this.#playerWrapper.pause();
        return;
      }
      
      // コントローラー画面では同期処理を完全に無効化
      if (!this.#options.isProjection) {
        return;
      }
      
      // 投影画面でのみ同期処理を実行
      if (this.#options.isProjection && !this.#isSuspended) {
        // 再生開始直後は同期をスキップ
        if (this.#lastStateChangeTime && Date.now() - this.#lastStateChangeTime < 1000) {
          return;
        }
        
        // 動画変更中は同期をスキップ
        if (this.#isVideoChanging) {
          return;
        }
        
        // 同期オフセットが大きい場合のみ同期を実行
        const currentPlayerTime = this.#playerWrapper.getCurrentTime();
        const expectedTime = this.#timeCalculator.calculateCurrentTime(this.#dataManager);
        const syncOffset = Math.abs(expectedTime - currentPlayerTime);
        
        if (syncOffset > 3.0) {
          this.syncTiming();
        }
      }
    }

    this.#lastStateChangeTime = Date.now();
    this.dispatchEvent("YTPlayerStateChange", event);
  }

  loadVideo(videoId) {
    this.#isVideoChanging = true;
    this.#isInitialized = false;

    try {
      this.#playerWrapper.loadVideo(videoId);
    } catch (error) {
      console.error("[VJPlayerManager] Error loading video:", error);
      this.#isVideoChanging = false;
      return;
    }

    // 動画ロード完了を待つ
    setTimeout(() => {
      if (!this.#isInitialized) {
        this.#isVideoChanging = false;
      }
    }, 5000);
  }
}
