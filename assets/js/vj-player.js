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
      loop: {
        start: -1,
        end: -1,
      },
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
        disablekb: this.#options.isProjection ? 0 : 1,
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
    const TIMING = this.#data.timing;
    const TIMESTAMP_NOW = new Date() / 1000;

    if (TIMING.timestamp == 0) return 0;
    if (this.#data.pause) return TIMING.playerTime;

    let expectPlayerTime =
      TIMING.playerTime + (TIMESTAMP_NOW - TIMING.timestamp) * this.#data.speed;

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

  get isMuted() {
    return this.#YTPlayer.isMuted();
  }

  get volume() {
    return this.#YTPlayer.getVolume();
  }

  get YTPlayerState() {
    return this.#YTPlayer.getPlayerState();
  }

  get isLoop() {
    return this.#data.loop.start < this.#data.loop.end;
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

    const onAnimationFrame = () => {
      this.currentTime;
      requestAnimationFrame(onAnimationFrame);
    };
    requestAnimationFrame(onAnimationFrame);
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

    const getTimeInfo = () => {
      const duration = this.#YTPlayer.getDuration();

      const expectPlayerTime = this.currentTime;
      const syncOffset = expectPlayerTime - this.#YTPlayer.getCurrentTime();

      return {
        expectPlayerTime,
        syncOffset,
        duration,
      };
    };

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

      const listener = (e) => {
        if (e.data === YT.PlayerState.PLAYING) {
          this.removeEventListener("YTPlayerStateChange", listener);
          jumpToSync();
        }
      };
      this.addEventListener("YTPlayerStateChange", listener);
      this.#YTPlayer.seekTo(t.expectPlayerTime);
    };

    const refineSync = () => {
      let isChecking = false;
      let checkCount = 0;
      const _refineSync = () => {
        const t = getTimeInfo();

        if (0.5 < Math.abs(t.syncOffset)) {
          jumpToSync();
          return;
        }

        if (t.syncOffset < -0.1) {
          this.#YTPlayer.seekTo(t.expectPlayerTime);
        } else {
          if (isChecking && Math.abs(t.syncOffset) < 0.01) {
            checkCount++;
            if (checkCount == 10) {
              this.stopSync();
              return;
            }
          } else {
            isChecking = false;

            let speed = this.#data.speed;
            let offsetSpeed = 0;

            if (Math.abs(t.syncOffset) < 0.005) {
              isChecking = true;
              checkCount = 0;
            } else {
              offsetSpeed = 0.05 * Math.max(1, parseInt(t.syncOffset * 20));
            }
            const playerSpeed = Math.floor((speed + offsetSpeed) / 0.05) * 0.05;
            this.#YTPlayer.setPlaybackRate(playerSpeed);
          }
        }
        requestAnimationFrame(_refineSync);
      };

      requestAnimationFrame(_refineSync);
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
