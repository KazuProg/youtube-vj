import EventEmitter from '../utils/EventEmitter.js';
import Storage from '../utils/Storage.js';

/**
 * YouTubeプレイヤーを管理するクラス
 */
export default class VJPlayer extends EventEmitter {
  #YTPlayer;
  #localStorageKey;
  #options;
  #syncing = false;
  #data = {};

  /**
   * @param {number} channel - チャンネル番号（0または1）
   * @param {Object} options - オプション
   * @param {boolean} options.isProjection - プロジェクション用かどうか
   */
  constructor(channel, options = {}) {
    super();
    const playerId = `vj_player_ch${channel}`;
    this.#localStorageKey = `ytvj_ch${channel}`;
    this.#options = {
      isProjection: false,
      ...options,
    };
    this.#data = {
      speed: 1,
      filter: {},
      pause: true,
      timing: {
        timestamp: 0,
        playerTime: 0,
      },
      videoId: null,
      loop: {
        start: -1,
        end: -1,
      },
    };

    this.#YTPlayer = new YT.Player(playerId, {
      videoId: "BLeUas72Mzk", // ローディング動画
      events: {
        onReady: (event) => {
          this.dispatchEvent("YTPlayerReady", event);
        },
        onStateChange: (event) => {
          this.dispatchEvent("YTPlayerStateChange", event);
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
    });

    this.addEventListener("YTPlayerReady", this.#onPlayerReady.bind(this));
    this.addEventListener("YTPlayerStateChange", this.#onPlayerStateChange.bind(this));
  }

  /**
   * ローカルストレージのキー
   */
  get localStorageKey() {
    return this.#localStorageKey;
  }

  /**
   * 動画タイトル
   */
  get videoTitle() {
    return this.#YTPlayer.videoTitle;
  }

  /**
   * 動画の長さ（秒）
   */
  get duration() {
    return this.#YTPlayer.getDuration();
  }

  /**
   * 現在の再生位置（秒）
   */
  get currentTime() {
    const TIMING = this.#data.timing;
    const TIMESTAMP_NOW = new Date() / 1000;

    if (TIMING.timestamp == 0) return 0;
    if (this.#data.pause) return TIMING.playerTime;

    let expectPlayerTime =
      TIMING.playerTime + (TIMESTAMP_NOW - TIMING.timestamp) * this.#data.speed;

    // ループ処理
    if (this.isLoop && this.#data.loop.end < expectPlayerTime) {
      this.#data.timing.timestamp =
        TIMESTAMP_NOW -
        (expectPlayerTime - this.#data.loop.end) / this.#data.speed;
      this.#data.timing.playerTime = this.#data.loop.start;
      expectPlayerTime -= this.#data.loop.end - this.#data.loop.start;
      this.syncTiming();
    }

    return expectPlayerTime;
  }

  /**
   * ミュート状態かどうか
   */
  get isMuted() {
    return this.#YTPlayer.isMuted();
  }

  /**
   * ボリューム（0-100）
   */
  get volume() {
    return this.#YTPlayer.getVolume();
  }

  /**
   * YouTubeプレイヤーの状態
   */
  get YTPlayerState() {
    return this.#YTPlayer.getPlayerState();
  }

  /**
   * ループ設定されているかどうか
   */
  get isLoop() {
    return this.#data.loop.start < this.#data.loop.end;
  }

  /**
   * YouTubeプレイヤーの準備完了時
   * @private
   */
  #onPlayerReady() {
    this.#YTPlayer.mute();

    document.addEventListener("VJPlayerUpdated", (event) => {
      if (event.detail.key === this.#localStorageKey) {
        const data = JSON.parse(event.detail.value);
        for (const key in data) {
          this.#applyData(key, data[key]);
        }
      }
    });

    // 初回データ読み込み
    document.dispatchEvent(
      new CustomEvent("VJPlayerUpdated", {
        detail: {
          key: this.#localStorageKey,
          value: localStorage.getItem(this.#localStorageKey),
        },
      })
    );

    // 定期的な同期
    setInterval(() => {
      this.syncTiming();
    }, 3000);

    // アニメーションフレームで再生位置を更新
    const onAnimationFrame = () => {
      this.currentTime; // ゲッターを呼ぶだけでループ処理などが行われる
      requestAnimationFrame(onAnimationFrame);
    };
    requestAnimationFrame(onAnimationFrame);
  }

  /**
   * データを適用する
   * @param {string} key - データキー
   * @param {any} value - 値
   * @private
   */
  #applyData(key, value) {
    // 同じ値なら何もしない
    if (JSON.stringify(this.#data[key]) === JSON.stringify(value)) {
      return;
    }
    
    // フィルターは既存のものとマージ
    if (key === "filter") {
      this.#data[key] = {
        ...this.#data[key],
        ...value,
      };
      value = this.#data[key];
    } else {
      this.#data[key] = value;
    }

    switch (key) {
      case "videoId":
        this.#YTPlayer.loadVideoById(value);
        break;
      case "pause":
        if (value === true) {
          this.#data.timing.playerTime = this.currentTime;
          this.#YTPlayer.pauseVideo();
        } else {
          this.#data.timing.timestamp = new Date() / 1000;
          this.#YTPlayer.playVideo();
        }
        break;
      case "timing":
      case "speed":
        this.#YTPlayer.playVideo();
        this.syncTiming();
        break;
      case "filter":
        if (this.#options.isProjection) {
          let filter = [];
          for (let key in value) {
            if (key === "opacity") continue;
            let cssKey = key;
            if (key == "hueRotate") cssKey = "hue-rotate";
            filter.push(`${cssKey}(${value[key]})`);
          }
          this.#YTPlayer.getIframe().style.filter = filter.join(" ");
        }
        break;
      case "zIndex":
        if (this.#options.isProjection) {
          this.#YTPlayer.getIframe().style.zIndex = value;
        }
        break;
      case "loop":
        break;
      default:
        console.warn(`YTVJ:P Unsupported ${key}`);
        return;
    }

    this.dispatchEvent("dataApplied", key, value);
  }

  /**
   * YouTubeプレイヤーの状態変更時
   * @param {Object} event - イベントオブジェクト
   * @private
   */
  #onPlayerStateChange(event) {
    const state = event.data;

    if (state === YT.PlayerState.UNSTARTED) {
      this.dispatchEvent("changed");
      return;
    }

    if (state === YT.PlayerState.PAUSED && this.#data.pause === false) {
      this.dispatchEvent("paused");
      return;
    }

    if (state === YT.PlayerState.PLAYING && this.#data.pause === true) {
      this.dispatchEvent("resumed");
      return;
    }

    if (state == YT.PlayerState.ENDED) {
      this.dispatchEvent("ended");
      return;
    }

    if (state == YT.PlayerState.PLAYING) {
      // 新動画読み込み時は自動再生されるっぽい？
      // 一時停止中にPreviewリロードで再生される対策
      if (this.#data.pause) {
        this.#YTPlayer.pauseVideo();
        return;
      }
      if (this.#options.isProjection) {
        this.syncTiming();
      }
    }
  }

  /**
   * 指定したキーの値を取得する
   * @param {string|null} key - キー（nullの場合は全てのデータを返す）
   * @returns {any} 値
   */
  getData(key = null) {
    if (key !== null) {
      return this.#data[key] || null;
    }
    return { ...this.#data };
  }

  /**
   * 再生位置をVJPlayer内部状態と同期する
   */
  syncTiming() {
    if (this.#syncing) return;
    this.#syncing = true;
    this.dispatchEvent("timeSyncStart");
    
    // 現在の再生情報を取得
    const getTimeInfo = () => {
      const actualTime = this.#YTPlayer.getCurrentTime();
      const timestamp = new Date() / 1000;
      
      if (this.#data.pause) {
        this.#data.timing.playerTime = actualTime;
      } else {
        this.#data.timing.playerTime = actualTime;
        this.#data.timing.timestamp = timestamp;
      }
      
      Storage.update(this.#localStorageKey, { timing: this.#data.timing });
    };

    // 再生位置をジャンプして同期
    const jumpToSync = () => {
      if (this.#data.pause) {
        // 一時停止中はYouTubeプレイヤーの位置を内部状態に合わせる
        const diffSec = Math.abs(this.#YTPlayer.getCurrentTime() - this.#data.timing.playerTime);
        if (diffSec > 0.5) {
          this.#YTPlayer.seekTo(this.#data.timing.playerTime, true);
        }
        this.#syncing = false;
        this.dispatchEvent("timeSyncEnd");
        return;
      }
      
      // 期待される再生位置と実際の再生位置の差が大きい場合、シーク操作で同期
      const listener = (e) => {
        if (e.data === YT.PlayerState.PLAYING) {
          this.#YTPlayer.removeEventListener("onStateChange", listener);
          refineSync();
        }
      };
      
      this.#YTPlayer.addEventListener("onStateChange", listener);
      this.#YTPlayer.playVideo();
      this.#YTPlayer.seekTo(this.currentTime, true);
    };

    // 細かい同期処理
    const refineSync = () => {
      let timeoutId = null;
      
      const _refineSync = () => {
        const actualTime = this.#YTPlayer.getCurrentTime();
        const expectedTime = this.currentTime;
        const diffSec = Math.abs(actualTime - expectedTime);
        
        if (diffSec < 0.2) {
          // 十分に同期できている
          this.#syncing = false;
          this.dispatchEvent("timeSyncEnd");
          return;
        }
        
        if (diffSec < 1.0) {
          // 少しずれている場合は再生速度で調整
          const adjustedSpeed = this.#data.speed * (expectedTime > actualTime ? 1.2 : 0.8);
          this.#YTPlayer.setPlaybackRate(adjustedSpeed);
          
          // 少し待ってから元の再生速度に戻す
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          timeoutId = setTimeout(() => {
            this.#YTPlayer.setPlaybackRate(this.#data.speed);
            
            // 再度チェック
            const newActualTime = this.#YTPlayer.getCurrentTime();
            const newExpectedTime = this.currentTime;
            const newDiffSec = Math.abs(newActualTime - newExpectedTime);
            
            if (newDiffSec > 0.5) {
              // まだずれている場合はシークで調整
              this.#YTPlayer.seekTo(newExpectedTime, true);
            }
            
            this.#syncing = false;
            this.dispatchEvent("timeSyncEnd");
          }, 500);
        } else {
          // 大きくずれている場合はシークで調整
          this.#YTPlayer.seekTo(expectedTime, true);
          this.#syncing = false;
          this.dispatchEvent("timeSyncEnd");
        }
      };
      
      _refineSync();
    };

    // 同期プロセスの実行
    getTimeInfo();
    jumpToSync();
  }

  /**
   * 同期処理を停止する
   */
  stopSync() {
    this.#syncing = false;
    this.dispatchEvent("timeSyncEnd");
  }

  /**
   * 再生する
   */
  play() {
    Storage.update(this.#localStorageKey, { pause: false });
  }

  /**
   * 一時停止する
   */
  pause() {
    Storage.update(this.#localStorageKey, { pause: true });
  }

  /**
   * ミュートする
   */
  mute() {
    this.#YTPlayer.mute();
  }

  /**
   * ミュート解除する
   */
  unmute() {
    this.#YTPlayer.unMute();
  }

  /**
   * ボリュームを設定する
   * @param {number} volume - ボリューム（0-100）
   */
  setVolume(volume) {
    this.#YTPlayer.setVolume(volume);
  }

  /**
   * 再生速度を設定する
   * @param {number} speed - 再生速度（0.25-2）
   */
  setSpeed(speed) {
    Storage.update(this.#localStorageKey, { speed });
  }

  /**
   * 動画を設定する
   * @param {string} videoId - YouTube動画ID
   */
  setVideo(videoId) {
    Storage.update(this.#localStorageKey, { videoId });
  }

  /**
   * フィルターを設定する
   * @param {Object} filter - フィルター設定
   */
  setFilter(filter) {
    Storage.update(this.#localStorageKey, { filter });
  }

  /**
   * Z-Indexを設定する
   * @param {number} zIndex - Z-Index値
   */
  setZIndex(zIndex) {
    Storage.update(this.#localStorageKey, { zIndex });
  }

  /**
   * ループ範囲を設定する
   * @param {number} start - 開始位置（秒）
   * @param {number} end - 終了位置（秒）
   */
  setLoop(start, end) {
    Storage.update(this.#localStorageKey, { loop: { start, end } });
  }

  /**
   * 指定した時間にシークする
   * @param {number} time - シーク位置（秒）
   */
  seekTo(time) {
    const newTiming = {
      playerTime: time,
      timestamp: new Date() / 1000
    };
    
    Storage.update(this.#localStorageKey, { timing: newTiming });
  }
} 