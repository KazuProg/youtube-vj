"use strict";

class VJPlayer {
  #player;
  #playerId;
  #localStorageKey;
  #options;
  #syncing = false;
  #data = {};

  constructor(channel, options = {}) {
    this.#playerId = `vj_player_ch${channel}`;
    this.#localStorageKey = `ytvj_ch${channel}`;
    this.#options = {
      isProjection: false,
      ...options,
      events: {
        onStateChange: () => {},
        onTimeSyncStart: () => {},
        onTimeSyncEnd: () => {},
        onDataApplied: () => {},
        ...options.events,
      },
    };
    this.#data = {
      speed: 1,
      pause: true,
      timing: {
        timestamp: 0,
        playerTime: 0,
      },
      videoId: "BLeUas72Mzk", //【フリー動画素材】ローディング動画4秒【ダウンロード可能】
    };

    this.#player = new YT.Player(this.#playerId, {
      videoId: this.#data.videoId,
      events: {
        onReady: (e) => {
          this.#onPlayerReady(e);
        },
        onStateChange: (e) => {
          this.#onPlayerStateChange(e);

          this.#options.events.onStateChange(e);
        },
      },
      playerVars: {
        fs: 0, // 全画面表示ボタンを非表示
        iv_load_policy: 3, // アノテーション無効
      },
    });
  }

  get localStorageKey() {
    return this.#localStorageKey;
  }

  get YTPlayer() {
    return this.#player;
  }

  #onPlayerReady() {
    //console.log(`YTVJ:P YouTube Player Ready`);

    this.#player.mute();

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
  }

  #applyData(key, value) {
    if (JSON.stringify(this.#data[key]) === JSON.stringify(value)) {
      return;
    }
    //console.log(`YTVJ:P 設定適用 ${key} = ${JSON.stringify(value)}`);
    this.#data[key] = value;
    switch (key) {
      case "videoId":
        this.#player.loadVideoById(value);
        break;
      case "pause":
        if (value === true) {
          this.#player.pauseVideo();
        } else {
          this.#player.playVideo();
        }
        break;
      case "timing":
        this.#player.playVideo();
        this.syncTiming();
        break;
      case "speed":
        this.#player.setPlaybackRate(value);
        break;
      case "opacity":
        if (this.#options.isProjection) {
          document.querySelector(`#${this.#playerId}`).style.opacity = value;
        }
        break;
      case "zIndex":
        if (this.#options.isProjection) {
          document.querySelector(`#${this.#playerId}`).style.zIndex = value;
        }
        break;
      default:
        console.warn(`YTVJ:P Unsupported ${key}`);
        return;
    }
    this.#options.events.onDataApplied(key, value);
  }

  #onPlayerStateChange(event) {
    /**
     * 3: BUFFERING
     * 5: CUED
     * 0: ENDED
     * 2: PAUSED
     * 1: PLAYING
     *-1: UNSTARTED
     */
    //console.log("YTVJ:P onPlayerStateChange:" + event.data);

    if (event.data == YT.PlayerState.ENDED) {
      event.target.seekTo(0);
      event.target.playVideo();
    }

    if (event.data == YT.PlayerState.PLAYING) {
      // 新動画読み込み時は自動再生されるっぽい？
      // 一時停止中にPreviewリロードで再生される対策
      if (this.#data.pause) {
        this.#player.pauseVideo();
        return;
      }
      if (this.#options.isProjection) {
        this.syncTiming();
      }
    }
  }

  syncTiming() {
    if (this.#syncing) return;

    // コントローラーからデータを受け取っていない
    if (this.#data.timing.timestamp == 0) return;

    this.#syncing = true;
    console.log(`YTVJ:P 同期処理`);

    this.#options.events.onTimeSyncStart();

    const process = () => {
      if (this.#data.pause) {
        this.stopSync();
        return;
      }
      const timing = this.#data.timing;
      const elapsedRealTime = new Date() / 1000 - timing.timestamp;

      const expectPlayerTime =
        timing.playerTime + elapsedRealTime * this.#data.speed;

      if (this.#player.getDuration() < expectPlayerTime) {
        // 計算上の再生位置が動画の長さよりも長ければ同期中止
        this.stopSync();
        console.log(`YTVJ:P 同期中止`);
      } else {
        const syncOffset = expectPlayerTime - this.#player.getCurrentTime();

        console.log(`YTVJ:P ズレ：${parseInt(syncOffset * 1000)}ms`);
        if (Math.abs(syncOffset) < 0.01) {
          this.stopSync();
          console.log(`YTVJ:P 同期完了`);
        } else if (Math.abs(syncOffset) > 5) {
          this.#player.seekTo(expectPlayerTime + 0.5);
          console.log(`YTVJ:P 強制同期`);
        } else {
          const offsetSpd =
            Math.sign(syncOffset) * Math.max(0.1, Math.abs(syncOffset));
          this.#player.setPlaybackRate(this.#data.speed + offsetSpd);
        }
      }
      if (this.#syncing) {
        setTimeout(() => {
          process();
        }, 100);
      } else {
        this.#player.setPlaybackRate(this.#data.speed);
        this.#options.events.onTimeSyncEnd();
      }
    };
    process();
  }

  stopSync() {
    this.#syncing = false;
  }
}
