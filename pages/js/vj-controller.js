"use strict";

class VJController {
  #channel;
  #data = {};
  #events;
  #isSuspendPreview = false;
  #isChangeTiming = false;
  #isChangeVideoId = false;

  constructor(channel, options = {}) {
    this.#channel = channel;
    this.#events = options.events;
    this.player = new VJPlayer(channel, {
      events: {
        onStateChange: (e) => {
          this._onPlayerStateChange(e);
        },
        onTimeSyncStart: () => {
          if (this.#events.onTimeSyncStart) {
            this.#events.onTimeSyncStart(this.#channel);
          }
        },
        onTimeSyncEnd: () => {
          if (this.#events.onTimeSyncEnd) {
            this.#events.onTimeSyncEnd(this.#channel);
          }
        },
        onDataApplied: (key, value) => {
          if (this.#events.onDataApplied) {
            this.#events.onDataApplied(this.#channel, key, value);
          }
        },
      },
    });

    localStorage.removeItem(this.player.localStorageKey);
    if (options.autoplay) {
      this.setData("pause", false);
    }
  }

  _onPlayerStateChange(e) {
    /**
     * 3: BUFFERING
     * 5: CUED
     * 0: ENDED
     * 2: PAUSED
     * 1: PLAYING
     *-1: UNSTARTED
     */
    /**
     * 動画変更時
     * PAUSED -> UNSTARTED -> BUFFERING -> UNSTARTED -> BUFFERING -> PLAYING
     * 再生位置変更時の遷移
     * PAUSED -> BUFFERING -> PLAYING
     * 動画終了時(自動再生)
     * ENDED -> PLAYING -> BUFFERING -> PLAYING
     */
    // 再生位置変更(単純なローディングはしらん)
    if (e.data == YT.PlayerState.BUFFERING) {
      this.setData("pause", false);
    }
    // 動画変更時は自動再生、タイミング通知
    if (e.data == YT.PlayerState.UNSTARTED) {
      this.setData("pause", false);
      this.#isChangeTiming = true;
      this.#isChangeVideoId = true;
    }
    if (e.data == YT.PlayerState.PAUSED) {
      if (this.#isSuspendPreview) {
        return;
      }
      this.setData("pause", true);
      this.#isChangeTiming = true;
    }

    if (e.data == YT.PlayerState.ENDED) {
      this.#isChangeTiming = true;
    }

    if (e.data == YT.PlayerState.PLAYING) {
      // 再生されたらプレビューの一時停止は解除
      if (this.#isSuspendPreview) {
        if (this.#events.onResumePreview) {
          this.#events.onResumePreview(this.#channel);
        }
        this.#isSuspendPreview = false;
      }
      if (this.#isChangeTiming) {
        this.setData("timing", this.#getTimingData());
        this.#isChangeTiming = false;
      } else {
        this.player.syncTiming();
      }
      if (this.#isChangeVideoId) {
        this.#isChangeVideoId = false;
        if (this.#data.videoId && this.#events.onChangeVideo) {
          this.#events.onChangeVideo(this.#channel, this.#data.videoId);
        }
      }
    }
  }

  setData(key, value) {
    this.#data[key] = value;
    if (key === "speed") {
      // 速度変更なら、タイミング情報も送信
      this.#data["timing"] = this.#getTimingData();
    }

    localStorage.setItem(
      this.player.localStorageKey,
      JSON.stringify(this.#data)
    );

    // カスタムイベントを作成して発火
    document.dispatchEvent(
      new CustomEvent("VJPlayerUpdated", {
        detail: {
          key: this.player.localStorageKey,
          value: JSON.stringify(this.#data),
        },
      })
    );
  }

  #getTimingData() {
    return {
      timestamp: +new Date() / 1000,
      playerTime: this.player.YTPlayer.getCurrentTime(),
    };
  }

  setVideo(id) {
    this.setData("videoId", id);
  }

  setSpeed(val) {
    const speedStep = 0.05;
    const _speedStep = 1 / speedStep;

    val = Math.round(parseFloat(val) * _speedStep) / _speedStep;

    if (val < 0.25) val = 0.25;
    if (2 < val) val = 2;

    this.setData("speed", val);
  }

  mute() {
    this.player.YTPlayer.mute();
  }

  unMute() {
    this.player.YTPlayer.unMute();
  }

  suspendPreview() {
    if (!this.#isSuspendPreview) {
      if (this.#events.onSuspendPreview) {
        this.#events.onSuspendPreview(this.#channel);
      }
      this.#isSuspendPreview = true;
    }
    this.player.stopSync();
    this.player.YTPlayer.pauseVideo();
  }

  resumePreview() {
    if (this.#isSuspendPreview) {
      this.player.YTPlayer.playVideo();
    }
  }

  adjustTiming(sec) {
    this.setData("timing", {
      timestamp: this.#data.timing.timestamp,
      playerTime: this.#data.timing.playerTime + sec,
    });
  }
}
