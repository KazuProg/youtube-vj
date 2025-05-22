import { AppConstants } from "./utils/constants";

class VJPlayer extends EventEmitter {
  #YTPlayer;
  #options;
  #syncing = false;
  #dataManager;

  constructor(channel, dataManager, options = {}) {
    super();
    const playerId = `vj_player_ch${channel}`;
    this.#dataManager = dataManager;
    this.#options = {
      isProjection: false,
      ...options,
    };

    this.#YTPlayer = new YT.Player(document.getElementById(playerId), {
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

  get YTPlayer() {
    return this.#YTPlayer;
  }

  #onPlayerReady() {
    this.#YTPlayer.mute();

    this.#dataManager.addEventListener(
      "changed",
      this.#onDataChanged.bind(this)
    );

    this.#dataManager.dispatchAll();

    setInterval(() => {
      this.syncTiming();
    }, APP_CONSTANTS.SYNC_INTERVAL);
  }

  #onDataChanged(key, value, data) {
    switch (key) {
      case "videoId":
        this.#YTPlayer.loadVideoById(value);
        break;
      case "pause":
        if (value === true) {
          this.#dataManager.timing.playerTime = this.#dataManager.currentTime;
          this.#YTPlayer.pauseVideo();
        } else {
          this.#dataManager.timing.timestamp = new Date() / 1000;
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

    if (state === YT.PlayerState.PAUSED && this.#dataManager.pause === false) {
      this.dispatchEvent("paused");
      return;
    }

    if (state === YT.PlayerState.PLAYING && this.#dataManager.pause === true) {
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
      if (this.#dataManager.pause) {
        this.#YTPlayer.pauseVideo();
        return;
      }
      if (this.#options.isProjection) {
        this.syncTiming();
      }
    }
  }

  syncTiming() {
    if (
      this.#syncing ||
      this.#dataManager.timing.timestamp == 0 ||
      this.#dataManager.pause
    ) {
      return;
    }

    this.#syncing = true;
    this.dispatchEvent("timeSyncStart");

    const getTimeInfo = () => {
      const duration = this.YTPlayer.getDuration();

      const expectPlayerTime = this.#dataManager.currentTime;
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

            let speed = this.#dataManager.speed;
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
}

export default VJPlayer;
