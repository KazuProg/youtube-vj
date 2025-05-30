/**
 * UIイベントハンドラーを管理するクラス
 * VJControllerからのイベントをUI要素に反映する責任を持つ
 */
export class UIEventHandlers {
  constructor(channels) {
    this.channels = channels;
  }

  /**
   * VJControllerイベントハンドラーを取得
   * @returns {Object} イベントハンドラーオブジェクト
   */
  getVJControllerEventHandlers() {
    return {
      onChangeVideo: this.onChangeVideo.bind(this),
      onSuspendPreview: this.onSuspendPreview.bind(this),
      onResumePreview: this.onResumePreview.bind(this),
      onTimeSyncStart: this.onTimeSyncStart.bind(this),
      onTimeSyncEnd: this.onTimeSyncEnd.bind(this),
      onDataApplied: this.onDataApplied.bind(this),
      onHotcueAdded: this.onHotcueAdded.bind(this),
      onHotcueRemoved: this.onHotcueRemoved.bind(this),
      onMuteChange: this.onMuteChange.bind(this),
    };
  }

  /**
   * 動画変更時の処理
   * @param {number} channel - チャンネル番号
   * @param {string} videoId - 動画ID
   */
  onChangeVideo(channel, videoId) {
    document.querySelector("#loadedVideoId").value = videoId;
    for (const c of this.channels) {
      c.channelNumber === channel ? c.unmute() : c.mute();
    }
    // Library.addHistory(videoId); // 外部依存のため呼び出し元で処理
    // selectCh(channel); // 外部依存のため呼び出し元で処理

    // カスタムイベントを発火して外部に通知
    this.dispatchCustomEvent("videoChanged", { channel, videoId });
  }

  /**
   * プレビュー一時停止時の処理
   * @param {number} channel - チャンネル番号
   */
  onSuspendPreview(channel) {
    const overlay = document.querySelector(`.deck.ch${channel} .suspend`);
    if (overlay) {
      overlay.classList.remove("hidden");
    }
  }

  /**
   * プレビュー再開時の処理
   * @param {number} channel - チャンネル番号
   */
  onResumePreview(channel) {
    const overlay = document.querySelector(`.deck.ch${channel} .suspend`);
    if (overlay) {
      overlay.classList.add("hidden");
    }
    this.dispatchCustomEvent("previewResumed", { channel });
  }

  /**
   * タイミング同期開始時の処理
   * @param {number} channel - チャンネル番号
   */
  onTimeSyncStart(channel) {
    const bar = document.querySelector(`.deck.ch${channel} .seek-bar`);
    if (bar) {
      bar.classList.add("syncing");
    }
  }

  /**
   * タイミング同期終了時の処理
   * @param {number} channel - チャンネル番号
   */
  onTimeSyncEnd(channel) {
    const bar = document.querySelector(`.deck.ch${channel} .seek-bar`);
    if (bar) {
      bar.classList.remove("syncing");
    }
  }

  /**
   * データ適用時の処理
   * @param {number} channel - チャンネル番号
   * @param {string} key - データキー
   * @param {*} val - データ値
   */
  onDataApplied(channel, key, val) {
    switch (key) {
      case "speed":
        this.updateSpeedUI(channel, val);
        break;
      case "filter":
        this.updateFilterUI(channel, val);
        break;
      case "loop":
        this.updateLoopUI(channel, val);
        break;
    }
    this.dispatchCustomEvent("dataApplied", { channel, key, val });
  }

  /**
   * 速度UIの更新
   * @param {number} channel - チャンネル番号
   * @param {number} val - 速度値
   */
  updateSpeedUI(channel, val) {
    const deck = document.querySelector(`.deck.ch${channel}`);
    if (!deck) return;

    const formattedVal = val.toFixed(2);
    const rangeInput = deck.querySelector(`.speed input[type=range]`);
    const numberInput = deck.querySelector(`.speed input[type=number]`);

    if (rangeInput) rangeInput.value = formattedVal;
    if (numberInput) numberInput.value = formattedVal;
  }

  /**
   * フィルターUIの更新
   * @param {number} channel - チャンネル番号
   * @param {Object} val - フィルター値
   */
  updateFilterUI(channel, val) {
    const opacityInput = document.querySelector(`.opacity .deck${channel}`);
    if (opacityInput && val.opacity !== undefined) {
      opacityInput.value = val.opacity;
    }
  }

  /**
   * ループUIの更新
   * @param {number} channel - チャンネル番号
   * @param {Object} val - ループ値
   */
  updateLoopUI(channel, val) {
    const loopParent = document.querySelector(`.deck.ch${channel} .loop`);
    if (!loopParent) return;

    loopParent.innerHTML = "";

    if (val.start !== -1) {
      const markerS = document.createElement("span");
      markerS.className = "loop-start";
      markerS.innerText = "|";
      markerS.style.left = `${
        (val.start / this.channels[channel].duration) * 100
      }%`;
      loopParent.appendChild(markerS);
    }

    if (val.end !== -1) {
      const markerE = document.createElement("span");
      markerE.className = "loop-end";
      markerE.innerText = "|";
      markerE.style.left = `${
        (val.end / this.channels[channel].duration) * 100
      }%`;
      loopParent.appendChild(markerE);
    }
  }

  /**
   * ホットキュー追加時の処理
   * @param {number} channel - チャンネル番号
   * @param {number} index - ホットキューインデックス
   * @param {number} time - 時間
   */
  onHotcueAdded(channel, index, time) {
    const hotcues = document.querySelector(`.deck.ch${channel} .hotcues`);
    if (!hotcues) return;

    const marker = document.createElement("span");
    marker.className = `hotcue${index}`;
    marker.innerText = index;
    marker.style.left = `${(time / this.channels[channel].duration) * 100}%`;
    hotcues.appendChild(marker);
  }

  /**
   * ホットキュー削除時の処理
   * @param {number} channel - チャンネル番号
   * @param {number} index - ホットキューインデックス
   */
  onHotcueRemoved(channel, index) {
    const marker = document.querySelector(`.deck.ch${channel} .hotcue${index}`);
    if (marker) {
      marker.remove();
    }
  }

  /**
   * ミュート状態変更時の処理
   * @param {number} channel - チャンネル番号
   * @param {boolean} isMute - ミュート状態
   */
  onMuteChange(channel, isMute) {
    const deck = document.querySelector(`.deck.ch${channel}`);
    if (!deck) return;

    if (isMute) {
      deck.classList.add("muted");
    } else {
      deck.classList.remove("muted");
      this.dispatchCustomEvent("channelUnmuted", { channel });
    }
  }

  /**
   * カスタムイベントを発火
   * @param {string} eventName - イベント名
   * @param {Object} detail - イベント詳細
   */
  dispatchCustomEvent(eventName, detail) {
    const event = new CustomEvent(`ui:${eventName}`, { detail });
    document.dispatchEvent(event);
  }
}
