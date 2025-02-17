"use strict";

class VJPlayer extends EventEmitter {
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
      filter: {},
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
        disablekb: 1,
        iv_load_policy: 3, // アノテーション無効
      },
    });
    this.addEventListener("YTPlayerReady", this.#onPlayerReady.bind(this));
    this.addEventListener(
      "YTPlayerStateChange",
      this.#onPlayerStateChange.bind(this)
    );
  }

  get localStorageKey() {
    return this.#localStorageKey;
  }

  get videoTitle() {
    return this.#YTPlayer.videoTitle;
  }

  get duration() {
    return this.#YTPlayer.getDuration();
  }

  get currentTime() {
    return this.#YTPlayer.getCurrentTime();
  }

  get isMuted() {
    return this.#YTPlayer.isMuted();
  }

  get volume() {
    return this.#YTPlayer.getVolume();
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

    setInterval(() => {
      this.syncTiming();
    }, 3000);
  }

  #applyData(key, value) {
    if (JSON.stringify(this.#data[key]) === JSON.stringify(value)) {
      return;
    }
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
      default:
        console.warn(`YTVJ:P Unsupported ${key}`);
        return;
    }

    this.dispatchEvent("dataApplied", key, value);
  }

  #onPlayerStateChange(event) {
    const state = event.data;

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
    if (this.#syncing || this.#data.timing.timestamp == 0 || this.#data.pause) {
      return;
    }

    this.#syncing = true;
    this.dispatchEvent("timeSyncStart");

    const jumpToSync = () => {
      const t = getTimeInfo();

      if (t.expectPlayerTime < 0 || t.duration < t.expectPlayerTime) {
        // 計算上の再生位置がマイナス or 動画の長さよりも長ければ同期中止
        this.stopSync();
        return;
      }

      if (Math.abs(t.syncOffset) < 0.5) {
        refineSync();
        return;
      }

      if (t.expectPlayerTime <= t.bufferedDuration) {
        const listener = (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            this.removeEventListener("YTPlayerStateChange", listener);
            refineSync();
          }
        };
        this.addEventListener("YTPlayerStateChange", listener);
        this.#YTPlayer.seekTo(t.expectPlayerTime);
      } else {
        let buffered = false;
        const listener = (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            if (buffered) {
              this.removeEventListener("YTPlayerStateChange", listener);
              refineSync();
              return;
            }

            const t = getTimeInfo();
            if (t.expectPlayerTime <= t.bufferedDuration) {
              buffered = true;
            }
            this.#YTPlayer.seekTo(t.expectPlayerTime);
          }
        };
        this.addEventListener("YTPlayerStateChange", listener);
        this.#YTPlayer.seekTo(t.expectPlayerTime);
      }
    };

    let refineSync_cnt = 0;
    const refineSync = () => {
      const _refineSync = () => {
        const t = getTimeInfo();
        if (0.5 < Math.abs(t.syncOffset)) {
          clearInterval(interval);
          jumpToSync();
          return;
        }

        if (Math.abs(t.syncOffset) < 0.01) {
          refineSync_cnt++;
          if (5 <= refineSync_cnt) {
            clearInterval(interval);
            this.stopSync();
          }
          this.#YTPlayer.setPlaybackRate(this.#data.speed);
        } else {
          refineSync_cnt = 0;
          const newSpeed =
            this.#data.speed + 0.05 * parseInt(t.syncOffset * 100);
          this.#YTPlayer.setPlaybackRate(newSpeed);
        }
      };

      const interval = setInterval(_refineSync, 50);
      _refineSync();
    };

    const getTimeInfo = () => {
      const timing = this.#data.timing;
      const buffered = this.#YTPlayer.getVideoLoadedFraction();
      const duration = this.#YTPlayer.getDuration();

      const bufferedDuration = duration * buffered;
      const elapsedRealTime = new Date() / 1000 - timing.timestamp;
      const expectPlayerTime =
        timing.playerTime + elapsedRealTime * this.#data.speed;
      const syncOffset = expectPlayerTime - this.#YTPlayer.getCurrentTime();

      return {
        expectPlayerTime,
        syncOffset,
        duration,
        bufferedDuration,
      };
    };

    jumpToSync();
  }

  stopSync() {
    this.#syncing = false;
    this.dispatchEvent("timeSyncEnd");
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

  unmute() {
    this.#YTPlayer.unMute();
  }

  setVolume(volume) {
    this.#YTPlayer.setVolume(volume);
  }
}
