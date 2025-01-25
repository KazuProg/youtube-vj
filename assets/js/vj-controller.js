"use strict";

class VJController extends EventEmitter {
  #channel;
  #VJPlayer = null;
  #isSuspendPreview = false;
  #isChangeTiming = false;
  #isChangeVideoId = false;
  #targetTime = null;
  #hotcues = [];

  constructor(channel, options = {}) {
    super();
    this.#channel = channel;
    this.#VJPlayer = new VJPlayer(channel);
    this.#VJPlayer.addEventListener(
      "YTPlayerStateChange",
      this.#onYTPlayerStateChange.bind(this)
    );
    this.#VJPlayer.addEventListener("timeSyncStart", () => {
      this.dispatchEvent("timeSyncStart", this.#channel);
    });
    this.#VJPlayer.addEventListener("timeSyncEnd", () => {
      this.dispatchEvent("timeSyncEnd", this.#channel);
    });
    this.#VJPlayer.addEventListener("dataApplied", (key, val) => {
      this.dispatchEvent("dataApplied", this.#channel, key, val);
    });

    localStorage.removeItem(this.#VJPlayer.localStorageKey);
    if (options.autoplay) {
      this.#setData("pause", false);
    }
  }

  get videoTitle() {
    return this.#VJPlayer.videoTitle;
  }

  get duration() {
    return this.#VJPlayer.duration;
  }

  get currentTime() {
    return this.#VJPlayer.currentTime;
  }

  get channelNumber() {
    return this.#channel;
  }

  get isMuted() {
    return this.#VJPlayer.isMuted;
  }

  setVideo(id) {
    this.#targetTime = null;
    if (id.indexOf("@") !== -1) {
      this.#targetTime = parseInt(id.split("@")[1]);
      id = id.split("@")[0];
    }
    this.#setData("videoId", id);
    for (const i in this.#hotcues) {
      this.removeHotcue(i);
    }
    this.#hotcues = [];
  }

  setSpeed(val, relative = false) {
    if (relative) {
      val = this.#VJPlayer.getData("speed") + val;
    }

    const speedStep = 0.05;
    const _speedStep = 1 / speedStep;

    val = Math.round(parseFloat(val) * _speedStep) / _speedStep;

    if (val < 0.25) val = 0.25;
    if (2 < val) val = 2;

    this.#setData("speed", val);
  }

  setTime(sec) {
    this.#setData("timing", {
      timestamp: +new Date() / 1000,
      playerTime: sec,
    });
  }

  setFilter(val) {
    const value = {
      ...this.#VJPlayer.getData("filter"),
      ...val,
    };
    this.#setData("filter", value);
  }

  hotcue(index) {
    if (this.#hotcues[index]) {
      this.playHotcue(index);
    } else {
      this.addHotcue(index);
    }
  }

  addHotcue(index) {
    this.removeHotcue(index); // 上書き用
    const time = this.currentTime;
    this.#hotcues[index] = time;
    this.dispatchEvent("hotcueAdded", this.#channel, index, time);
  }

  playHotcue(index) {
    if (this.#hotcues[index]) {
      this.setTime(this.#hotcues[index]);
    }
  }

  removeHotcue(index) {
    if (this.#hotcues[index]) {
      this.#hotcues[index] = null;
      this.dispatchEvent("hotcueRemoved", this.#channel, index);
    }
  }

  suspendPreview() {
    if (!this.#isSuspendPreview) {
      this.dispatchEvent("suspendPreview", this.#channel);
      this.#isSuspendPreview = true;
    }
    this.#VJPlayer.stopSync();
    this.#VJPlayer.pause();
  }

  resumePreview() {
    if (this.#isSuspendPreview) {
      this.#VJPlayer.play();
    }
  }

  adjustTiming(sec) {
    let timing = this.#VJPlayer.getData("timing");
    timing.playerTime += sec;
    this.#setData("timing", timing);
  }

  play() {
    this.#VJPlayer.play();
  }

  pause() {
    this.#VJPlayer.pause();
  }

  togglePlayPause() {
    if (this.#VJPlayer.YTPlayerState === YT.PlayerState.PLAYING) {
      this.pause();
    } else {
      this.play();
    }
  }

  mute() {
    this.#VJPlayer.mute();
  }

  unmute() {
    this.#VJPlayer.unmute();
  }

  toggleMuteUnmute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  #onYTPlayerStateChange(e) {
    switch (e.data) {
      case YT.PlayerState.BUFFERING:
        // 再生位置変更(単純なローディングはしらん)
        this.#setData("pause", false);
        break;
      case YT.PlayerState.UNSTARTED:
        // 動画変更時は自動再生、タイミング通知
        this.#setData("pause", false);
        if (this.#targetTime) {
          this.#setData("timing", {
            timestamp: +new Date() / 1000,
            playerTime: this.#targetTime,
          });
          // タイミング変更なしにすることで強制Sync
          this.#isChangeTiming = false;
        } else {
          this.#isChangeTiming = true;
        }
        this.#isChangeVideoId = true;
        break;
      case YT.PlayerState.PAUSED:
        if (this.#isSuspendPreview) return;
        this.#setData("pause", true);
        this.#isChangeTiming = true;
        break;
      case YT.PlayerState.ENDED:
        this.#isChangeTiming = true;
        break;
      case YT.PlayerState.PLAYING:
        // 再生されたらプレビューの一時停止は解除
        if (this.#isSuspendPreview) {
          this.dispatchEvent("resumePreview", this.#channel);
          this.#isSuspendPreview = false;
        }
        if (this.#isChangeTiming) {
          this.#setData("timing", this.#getTimingData());
          this.#isChangeTiming = false;
        } else {
          this.#VJPlayer.syncTiming();
        }
        if (this.#isChangeVideoId) {
          this.#isChangeVideoId = false;
          const videoId = this.#VJPlayer.getData("videoId");
          if (videoId) {
            this.dispatchEvent("changeVideo", this.#channel, videoId);
          }
        }
        break;
    }
  }

  #setData(key, value) {
    let data = this.#VJPlayer.getData();

    data[key] = value;
    if (key === "speed") {
      // 速度変更なら、タイミング情報も送信
      data["timing"] = this.#getTimingData();
    }

    localStorage.setItem(this.#VJPlayer.localStorageKey, JSON.stringify(data));

    // カスタムイベントを作成して発火
    document.dispatchEvent(
      new CustomEvent("VJPlayerUpdated", {
        detail: {
          key: this.#VJPlayer.localStorageKey,
          value: JSON.stringify(data),
        },
      })
    );
  }

  #getTimingData() {
    return {
      timestamp: +new Date() / 1000,
      playerTime: this.#VJPlayer.currentTime,
    };
  }
}
