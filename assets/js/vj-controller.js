"use strict";

class VJController extends EventEmitter {
  #channel;
  #VJPlayer = null;
  #isSuspendPreview = false;
  #isChangeTiming = false;
  #isChangeVideoId = false;
  #targetTime = null;
  #hotcues = [];
  #volume = 100;
  #isMuted = false;

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
    this.#VJPlayer.addEventListener("changed", this.#onChanged.bind(this));
    this.#VJPlayer.addEventListener("paused", this.#onPaused.bind(this));
    this.#VJPlayer.addEventListener("resumed", this.#onResumed.bind(this));
    this.#VJPlayer.addEventListener("ended", this.#onEnded.bind(this));

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
    const paused = this.#VJPlayer.getData("pause");
    if (this.#isSuspendPreview && !paused) {
      const timing = this.#VJPlayer.getData("timing");
      const speed = this.#VJPlayer.getData("speed");

      if (timing.timestamp == 0) return 0;

      const elapsed = +new Date() / 1000 - timing.timestamp;
      const current = timing.playerTime + elapsed * speed;

      if (this.duration < current) {
        current = this.duration;
      }

      return current;
    } else {
      return this.#VJPlayer.currentTime;
    }
  }

  get channelNumber() {
    return this.#channel;
  }

  get isMuted() {
    return this.#isMuted;
  }

  set isMuted(val) {
    if (val) {
      this.#VJPlayer.mute();
    } else {
      this.#VJPlayer.unmute();
      this.setVolume(this.#volume);
    }
    if (val === this.#isMuted) return;
    this.#isMuted = val;
    this.dispatchEvent("muteChange", this.#channel, val);
  }

  get volume() {
    return this.#volume;
  }

  set volume(val) {
    this.#volume = val;
    this.#VJPlayer.setVolume(val);
  }

  setVideo(id) {
    this.#targetTime = null;
    if (id.indexOf("@") !== -1) {
      this.#targetTime = parseInt(id.split("@")[1]);
      id = id.split("@")[0];
    }
    this.#setData("videoId", id);
    this.setTime(0);
    for (const i in this.#hotcues) {
      this.removeHotcue(i);
    }
    this.#hotcues = [];
  }

  setSpeed(val, relative = false) {
    if (relative) {
      val = this.#VJPlayer.getData("speed") + val;
    }

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

  loopStart() {
    const loop = this.#VJPlayer.getData("loop");
    loop.start = this.currentTime;
    this.#setData("loop", loop);
  }

  loopEnd() {
    const loop = this.#VJPlayer.getData("loop");
    loop.end = this.currentTime;
    this.#setData("loop", loop);
  }

  loopClear() {
    const loop = this.#VJPlayer.getData("loop");
    loop.start = -1;
    loop.end = -1;
    this.#setData("loop", loop);
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
    this.isMuted = true;
  }

  unmute() {
    this.isMuted = false;
  }

  toggleMuteUnmute() {
    this.isMuted = !this.isMuted;
  }

  setVolume(val) {
    this.volume = val;
  }

  fadeoutVolume() {
    this.#isMuted = true;
    const fadeout = setInterval(() => {
      if (!this.#isMuted) {
        clearInterval(fadeout);
        return;
      }

      this.#VJPlayer.setVolume(this.#VJPlayer.volume - 1);

      if (this.#VJPlayer.volume <= 0) {
        clearInterval(fadeout);
      }
    }, 20);
  }

  #onYTPlayerStateChange(e) {
    switch (e.data) {
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

  #onChanged() {
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
  }

  #onPaused() {
    if (this.#isSuspendPreview) return;
    this.#setData("timing", this.#getTimingData());
    this.#setData("pause", true);
    this.#isChangeTiming = true;
  }

  #onResumed() {
    this.#setData("timing", this.#getTimingData());
    this.#setData("pause", false);
    this.#isChangeTiming = true;
  }

  #onEnded() {
    this.#setData("pause", true);
    this.#setData("timing", {
      timestamp: 0,
      playerTime: 0,
    });
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
