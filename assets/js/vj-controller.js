"use strict";

class VJController {
  #channel;
  #events;
  #VJPlayer = null;
  #isSuspendPreview = false;
  #isChangeTiming = false;
  #isChangeVideoId = false;

  constructor(channel, options = {}) {
    this.#channel = channel;
    this.#events = options.events || {};
    this.#VJPlayer = new VJPlayer(channel);
    this.#VJPlayer.addEventListener("onYTPlayerStateChange", (e) => {
      this.#onYTPlayerStateChange(e);
    });
    this.#VJPlayer.addEventListener("onTimeSyncStart", (e) => {
      if (this.#events.onTimeSyncStart) {
        this.#events.onTimeSyncStart(this.#channel);
      }
    });
    this.#VJPlayer.addEventListener("onTimeSyncEnd", (e) => {
      if (this.#events.onTimeSyncEnd) {
        this.#events.onTimeSyncEnd(this.#channel);
      }
    });
    this.#VJPlayer.addEventListener("onDataApplied", (e) => {
      if (this.#events.onDataApplied) {
        this.#events.onDataApplied(this.#channel, e.detail.key, e.detail.value);
      }
    });

    localStorage.removeItem(this.#VJPlayer.localStorageKey);
    if (options.autoplay) {
      this.#setData("pause", false);
    }
  }

  get videoTitle() {
    return this.#VJPlayer.videoTitle;
  }

  get currentTime() {
    return this.#VJPlayer.currentTime;
  }

  get channelNumber() {
    return this.#channel;
  }

  setVideo(id) {
    this.#setData("videoId", id);
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

  setOpacity(val, relative = false) {
    if (relative) {
      val = this.#VJPlayer.getData("opacity") + val;
    }

    if (val < 0) val = 0;
    if (1 < val) val = 1;

    this.#setData("opacity", val);
  }

  suspendPreview() {
    if (!this.#isSuspendPreview) {
      if (this.#events.onSuspendPreview) {
        this.#events.onSuspendPreview(this.#channel);
      }
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

  unMute() {
    this.#VJPlayer.unMute();
  }

  toggleMuteUnmute() {
    if (this.#VJPlayer.isMuted) {
      this.unMute();
    } else {
      this.mute();
    }
  }

  #onYTPlayerStateChange(e) {
    switch (e.detail.data) {
      case YT.PlayerState.BUFFERING:
        // 再生位置変更(単純なローディングはしらん)
        this.#setData("pause", false);
        break;
      case YT.PlayerState.UNSTARTED:
        // 動画変更時は自動再生、タイミング通知
        this.#setData("pause", false);
        this.#isChangeTiming = true;
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
          if (this.#events.onResumePreview) {
            this.#events.onResumePreview(this.#channel);
          }
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
          if (videoId && this.#events.onChangeVideo) {
            this.#events.onChangeVideo(this.#channel, videoId);
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
