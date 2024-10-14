"use strict";

class VJPlayer extends EventTarget {
  #YTPlayer;
  #localStorageKey;
  #options;
  #syncing = false;
  #data = {};

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
      opacity: 1,
      pause: true,
      timing: {
        timestamp: 0,
        playerTime: 0,
      },
      videoId: null,
    };

    this.#YTPlayer = new YT.Player(playerId, {
      videoId: "BLeUas72Mzk", //【フリー動画素材】ローディング動画4秒【ダウンロード可能】
      events: {
        onReady: (event) => {
          this.dispatchEvent(
            new CustomEvent("onYTPlayerReady", {
              detail: { ...event },
            })
          );
        },
        onStateChange: (event) => {
          this.dispatchEvent(
            new CustomEvent("onYTPlayerStateChange", {
              detail: { ...event },
            })
          );
        },
        onPlaybackQualityChange: (event) => {
          this.dispatchEvent(
            new CustomEvent("onYTPlayerPlaybackQualityChange", {
              detail: { ...event },
            })
          );
        },
        onPlaybackRateChange: (event) => {
          this.dispatchEvent(
            new CustomEvent("onYTPlayerPlaybackRateChange", {
              detail: { ...event },
            })
          );
        },
        onError: (event) => {
          this.dispatchEvent(
            new CustomEvent("onYTPlayerError", {
              detail: { ...event },
            })
          );
        },
        onApiChange: (event) => {
          this.dispatchEvent(
            new CustomEvent("onYTPlayerApiChange", {
              detail: { ...event },
            })
          );
        },
      },
      playerVars: {
        fs: 0, // 全画面表示ボタンを非表示
        iv_load_policy: 3, // アノテーション無効
      },
    });
    this.addEventListener("onYTPlayerReady", (e) => this.#onPlayerReady(e));
    this.addEventListener("onYTPlayerStateChange", (e) =>
      this.#onPlayerStateChange(e)
    );
  }

  get localStorageKey() {
    return this.#localStorageKey;
  }

  get videoTitle() {
    return this.#YTPlayer.videoTitle;
  }

  get currentTime() {
    return this.#YTPlayer.getCurrentTime();
  }

  get isMuted() {
    return this.#YTPlayer.isMuted();
  }

  get YTPlayerState() {
    return this.#YTPlayer.getPlayerState();
  }

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

    if (this.#options.isProjection) {
      setInterval(() => {
        this.syncTiming();
      }, 3000);
    }
  }

  #applyData(key, value) {
    if (JSON.stringify(this.#data[key]) === JSON.stringify(value)) {
      return;
    }
    //console.log(`YTVJ:P 設定適用 ${key} = ${JSON.stringify(value)}`);
    this.#data[key] = value;
    switch (key) {
      case "videoId":
        this.#YTPlayer.loadVideoById(value);
        break;
      case "pause":
        if (value === true) {
          this.#YTPlayer.pauseVideo();
        } else {
          this.#YTPlayer.playVideo();
        }
        break;
      case "timing":
        this.#YTPlayer.playVideo();
        this.syncTiming();
        break;
      case "speed":
        this.#YTPlayer.setPlaybackRate(value);
        break;
      case "opacity":
        if (this.#options.isProjection) {
          this.#YTPlayer.getIframe().style.opacity = value;
        }
        break;
      case "zIndex":
        if (this.#options.isProjection) {
          this.#YTPlayer.getIframe().style.zIndex = value;
        }
        break;
      default:
        console.warn(`YTVJ:P Unsupported ${key}`);
        return;
    }

    this.dispatchEvent(
      new CustomEvent("onDataApplied", {
        detail: { key, value },
      })
    );
  }

  #onPlayerStateChange(event) {
    const state = event.detail.data;

    if (state == YT.PlayerState.ENDED) {
      this.#YTPlayer.seekTo(0);
      this.#YTPlayer.playVideo();
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

  getData(key = null) {
    let result = this.#data;
    if (key !== null) {
      result = this.#data[key] || null;
    }
    return JSON.parse(JSON.stringify(result));
  }

  syncTiming() {
    if (this.#syncing) return;

    if (this.#data.timing.timestamp == 0) return;

    this.#syncing = true;
    console.log(`YTVJ:P 同期処理`);

    this.dispatchEvent(new Event("onTimeSyncStart"));

    const process = () => {
      if (this.#data.pause) {
        this.stopSync();
        return;
      }
      const timing = this.#data.timing;
      const elapsedRealTime = new Date() / 1000 - timing.timestamp;

      const expectPlayerTime =
        timing.playerTime + elapsedRealTime * this.#data.speed;

      if (this.#YTPlayer.getDuration() < expectPlayerTime) {
        // 計算上の再生位置が動画の長さよりも長ければ同期中止
        this.stopSync();
        console.log(`YTVJ:P 同期中止`);
      } else {
        const syncOffset = expectPlayerTime - this.#YTPlayer.getCurrentTime();

        console.log(`YTVJ:P ズレ：${parseInt(syncOffset * 1000)}ms`);
        if (Math.abs(syncOffset) < 0.01) {
          this.stopSync();
          console.log(`YTVJ:P 同期完了`);
        } else if (Math.abs(syncOffset) > 5) {
          this.#YTPlayer.seekTo(expectPlayerTime + 0.5);
          console.log(`YTVJ:P 強制同期`);
        } else {
          const offsetSpd =
            Math.sign(syncOffset) * Math.max(0.1, Math.abs(syncOffset));
          this.#YTPlayer.setPlaybackRate(this.#data.speed + offsetSpd);
        }
      }
      if (this.#syncing) {
        setTimeout(() => {
          process();
        }, 100);
      } else {
        this.#YTPlayer.setPlaybackRate(this.#data.speed);
        this.dispatchEvent(new Event("onTimeSyncEnd"));
      }
    };
    process();
  }

  stopSync() {
    this.#syncing = false;
  }

  play() {
    this.#YTPlayer.playVideo();
  }

  pause() {
    this.#YTPlayer.pauseVideo();
  }

  mute() {
    this.#YTPlayer.mute();
  }

  unMute() {
    this.#YTPlayer.unMute();
  }
}
