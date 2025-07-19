/**
 * VJPlayerイベントハンドラー
 */
export class VJPlayerEventHandler {
  #dataSyncService;
  #onDispatchEvent;
  #channel;
  #isSuspendPreview = false;
  #isChangeTiming = false;
  #isChangeVideoId = false;
  #targetTime = null;

  /**
   * @param {Object} dataSyncService - データ同期サービス
   * @param {Function} onDispatchEvent - イベント発火コールバック
   * @param {number} channel - チャンネル番号
   */
  constructor(dataSyncService, onDispatchEvent, channel) {
    this.#dataSyncService = dataSyncService;
    this.#onDispatchEvent = onDispatchEvent;
    this.#channel = channel;
  }

  /**
   * プレビュー一時停止状態を取得
   * @returns {boolean} 一時停止状態
   */
  get isSuspendPreview() {
    return this.#isSuspendPreview;
  }

  /**
   * プレビュー一時停止状態を設定
   * @param {boolean} value - 一時停止状態
   */
  setSuspendPreview(value) {
    this.#isSuspendPreview = value;
  }

  /**
   * ターゲット時間を設定
   * @param {number} time - ターゲット時間
   */
  setTargetTime(time) {
    this.#targetTime = time;
  }

  /**
   * YouTube Player状態変更イベント
   * @param {Object} event - イベント
   */
  onYTPlayerStateChange(event) {
    console.log(`[Channel ${this.#channel}] YTPlayer state changed to:`, event.data, `(isSuspendPreview: ${this.#isSuspendPreview})`);
    
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        // 再生されたらプレビューの一時停止は解除
        // ただし、明示的にsuspendPreviewが設定されている場合は自動復帰しない
        if (this.#isSuspendPreview) {
          console.log(`[Channel ${this.#channel}] PLAYING state detected but suspendPreview is active - forcing pause`);
          // 強制的に一時停止を維持（外部に依頼）
          this.#onDispatchEvent("forcePause", this.#channel);
          return; // resumePreviewイベントを発火しない
        }
        if (this.#isChangeTiming) {
          this.#dataSyncService.setData(
            "timing",
            this.#dataSyncService.getTimingData()
          );
          this.#isChangeTiming = false;
        } else {
          // VJPlayerの同期を呼び出す必要があるが、ここでは外部に委譲
          this.#onDispatchEvent("syncTiming");
        }
        if (this.#isChangeVideoId) {
          this.#isChangeVideoId = false;
          // 動画ID変更イベントを発火
          this.#onDispatchEvent("videoIdChanged");
        }
        break;
    }
  }

  /**
   * 動画変更イベント
   */
  onChanged() {
    // 動画変更時は自動再生、タイミング通知
    this.#dataSyncService.setData("pause", false);
    if (this.#targetTime) {
      this.#dataSyncService.setData("timing", {
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

  /**
   * 一時停止イベント
   */
  onPaused() {
    if (this.#isSuspendPreview) return;
    this.#dataSyncService.setData(
      "timing",
      this.#dataSyncService.getTimingData()
    );
    this.#dataSyncService.setData("pause", true);
    this.#isChangeTiming = true;
  }

  /**
   * 再開イベント
   */
  onResumed() {
    this.#dataSyncService.setData(
      "timing",
      this.#dataSyncService.getTimingData()
    );
    this.#dataSyncService.setData("pause", false);
    this.#isChangeTiming = true;
  }

  /**
   * 終了イベント
   */
  onEnded() {
    this.#dataSyncService.setData("timing", {
      timestamp: new Date() / 1000,
      playerTime: 0,
    });
  }
}
