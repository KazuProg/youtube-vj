class VJController {
  #data = {};
  #events;
  #isSuspendPreview = false;
  #isChangeTiming = false;

  constructor(channel, events = {}) {
    this.#events = events;
    this.player = new VJPlayer(channel, {
      events: {
        onStateChange: (e) => {
          this._onPlayerStateChange(e);
        },
        onSyncStart: () => {
          if (this.#events.onSyncStart) {
            this.#events.onSyncStart(channel);
          }
        },
        onSyncEnd: () => {
          if (this.#events.onSyncEnd) {
            this.#events.onSyncEnd(channel);
          }
        },
      },
    });

    localStorage.removeItem(this.player.localStorageKey);
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
          this.#events.onResumePreview(channel);
        }
        this.#isSuspendPreview = false;
      }
      if (this.#isChangeTiming) {
        this.setData("timing", this.#getTimingData());
        this.#isChangeTiming = false;
      } else {
        this.player.syncTiming();
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

    if (key === "videoId") {
      if (this.#events.onChangeVideo) {
        this.#events.onChangeVideo(channel, value);
      }
    }
  }

  #getTimingData() {
    return {
      timestamp: +new Date() / 1000,
      playerTime: this.player.YTPlayer.getCurrentTime(),
    };
  }

  suspendPreview() {
    if (!this.#isSuspendPreview) {
      if (this.#events.onSuspendPreview) {
        this.#events.onSuspendPreview(channel);
      }
      this.#isSuspendPreview = true;
    }
    this.player._syncing = false;
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
