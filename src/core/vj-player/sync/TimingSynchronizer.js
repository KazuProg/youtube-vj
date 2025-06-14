import { ITimingSynchronizer } from "../interfaces/ITimingSynchronizer.js";

/**
 * タイミング同期の実装
 */
export class TimingSynchronizer extends ITimingSynchronizer {
  #syncing = false;
  #player;
  #dataManager;
  #timeCalculator;
  #onSyncStart;
  #onSyncEnd;
  #syncAttempts = 0; // 同期試行回数を追跡
  #maxSyncAttempts = 10; // 最大同期試行回数

  /**
   * 同期を開始
   * @param {IYouTubePlayerWrapper} player - プレイヤー
   * @param {Object} dataManager - データマネージャー
   * @param {ITimeCalculator} timeCalculator - 時間計算器
   * @param {Function} onSyncStart - 同期開始コールバック
   * @param {Function} onSyncEnd - 同期終了コールバック
   */
  startSync(player, dataManager, timeCalculator, onSyncStart, onSyncEnd) {
    // タイムスタンプが0または一時停止中の場合は同期しない
    if (dataManager.timing.timestamp === 0 || dataManager.pause) {
      return;
    }

    // プレイヤーの状態をチェック
    try {
      const playerState = player.getPlayerState();
      if (playerState === YT.PlayerState.BUFFERING || playerState === YT.PlayerState.UNSTARTED) {
        return;
      }
    } catch (error) {
      return;
    }

    // 既に同期中の場合は、既存の同期を停止してから新しい同期を開始
    if (this.#syncing) {
      this.stopSync();
    }

    this.#syncing = true;
    this.#syncAttempts = 0; // 同期試行回数をリセット
    this.#player = player;
    this.#dataManager = dataManager;
    this.#timeCalculator = timeCalculator;
    this.#onSyncStart = onSyncStart;
    this.#onSyncEnd = onSyncEnd;

    if (this.#onSyncStart) {
      this.#onSyncStart();
    }
    this.#jumpToSync();
  }

  /**
   * 同期を停止
   */
  stopSync() {
    this.#syncing = false;
    this.#syncAttempts = 0; // 同期試行回数をリセット
    if (this.#onSyncEnd) {
      this.#onSyncEnd();
    }
  }

  /**
   * 同期中かどうか
   * @returns {boolean} 同期中フラグ
   */
  isSyncing() {
    return this.#syncing;
  }

  /**
   * 時間情報を取得
   * @returns {Object} 時間情報
   */
  #getTimeInfo() {
    const duration = this.#player.getDuration();
    const currentPlayerTime = this.#player.getCurrentTime();
    const calculatedCurrentTime = this.#timeCalculator.calculateCurrentTime(this.#dataManager);
    const expectPlayerTime = calculatedCurrentTime % duration;
    const syncOffset = expectPlayerTime - currentPlayerTime;

    const timeInfo = {
      expectPlayerTime,
      syncOffset,
      duration,
      currentTime: calculatedCurrentTime,
      currentPlayerTime
    };
    


    return timeInfo;
  }

  /**
   * ジャンプして同期
   */
  #jumpToSync() {
    // 同期試行回数をチェック
    this.#syncAttempts++;
    if (this.#syncAttempts > this.#maxSyncAttempts) {
      this.stopSync();
      return;
    }
    
    const t = this.#getTimeInfo();
    
    // currentTimeが未定義の場合は同期をスキップ
    if (typeof t.currentTime === 'undefined') {
      return;
    }

    // 期待値がNaNの場合は同期をスキップ
    if (isNaN(t.expectPlayerTime)) {
      return;
    }

    // 同期オフセットが非常に大きい場合（10秒以上）は同期を停止
    if (Math.abs(t.syncOffset) > 10) {
      this.stopSync();
      return;
    }

    if (t.expectPlayerTime < 0 || t.duration < t.expectPlayerTime) {
      this.stopSync();
      return;
    }

    if (Math.abs(t.syncOffset) < 0.5) {
      this.#refineSync();
      return;
    }

    const listener = (e) => {
      if (e.data === YT.PlayerState.PLAYING) {
        this.#player.removeEventListener("YTPlayerStateChange", listener);
        this.#jumpToSync();
      }
    };
    this.#player.addEventListener("YTPlayerStateChange", listener);
    this.#player.seekTo(t.expectPlayerTime);
  }

  /**
   * 精密同期
   */
  #refineSync() {
    let isChecking = false;
    let checkCount = 0;

    const refineLoop = () => {
      const t = this.#getTimeInfo();

      if (0.5 < Math.abs(t.syncOffset)) {
        this.#jumpToSync();
        return;
      }

      if (t.syncOffset < -0.1) {
        this.#player.seekTo(t.expectPlayerTime);
      } else {
        if (isChecking && Math.abs(t.syncOffset) < 0.01) {
          checkCount++;
          if (checkCount === 10) {
            const originalSpeed = this.#dataManager.speed;
            try {
              this.#player.setPlaybackRate(originalSpeed);
            } catch (error) {
              // YouTube Playerが初期化されていない場合のエラーハンドリング
            }
            this.#syncAttempts = 0; // 同期完了時に試行回数をリセット
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
          try {
            this.#player.setPlaybackRate(playerSpeed);
          } catch (error) {
            // YouTube Playerが初期化されていない場合のエラーハンドリング
          }
        }
      }
      requestAnimationFrame(refineLoop);
    };

    requestAnimationFrame(refineLoop);
  }
}
