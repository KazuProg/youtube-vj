import { INITIAL_SYNC_DATA, SYNC_CONFIG } from "@/constants";
import { useCallback, useEffect, useRef } from "react";
import type { VJSyncData } from "../../types";
import { usePlaybackRateAdjustment } from "../usePlaybackRateAdjustment";
import { useTimeSync } from "../useTimeSync";

/** プレイヤー同期用のインターフェース */
export interface PlayerSyncInterface {
  getCurrentTime: () => number | null;
  getDuration: () => number | null;
  setPlaybackRate: (rate: number) => boolean;
  seekTo: (time: number) => void;
}

/** カスタムフックの戻り値 */
export interface UsePlayerSyncReturn {
  getCurrentTime: () => number | null;
  setDuration: (duration: number | null) => void;
  notifySyncData: (syncData: VJSyncData) => void;
  isSyncing: boolean;
}

/**
 * プレイヤー同期用のカスタムフック
 * 時間同期と速度調整を統合して、プレイヤーの同期を管理する
 *
 * @param playerInterface プレイヤー操作のインターフェース
 * @returns 同期制御用の関数群
 */
export const usePlayerSync = (playerInterface: PlayerSyncInterface): UsePlayerSyncReturn => {
  const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);
  const isSyncingRef = useRef<boolean>(false);

  // 時間同期フック
  const { getExpectedCurrentTime, setDuration } = useTimeSync(syncDataRef);

  // 再生速度調整フック
  const { calculateAdjustmentRate, applyPlaybackRateAdjustment, syncPlaybackRate, isAdjusting } =
    usePlaybackRateAdjustment({
      syncDataRef,
      setPlaybackRate: playerInterface.setPlaybackRate,
    });

  /**
   * メインの同期処理（再帰的に requestAnimationFrame で呼び出される）
   */
  const _sync = useCallback(() => {
    const expectedCurrentTime = getExpectedCurrentTime();
    if (expectedCurrentTime === null) {
      return;
    }

    try {
      const syncData = syncDataRef.current;
      const currentPlayerTime = playerInterface.getCurrentTime();

      if (currentPlayerTime === null) {
        return;
      }

      const timeDiff = currentPlayerTime - expectedCurrentTime;
      const absTimeDiff = Math.abs(timeDiff);

      if (absTimeDiff <= SYNC_CONFIG.syncThreshold) {
        // 差分が閾値以下の場合、設定された速度をそのまま使用
        if (!isAdjusting()) {
          syncPlaybackRate();
          isSyncingRef.current = false;
        }
      } else if (absTimeDiff >= SYNC_CONFIG.seekThreshold) {
        // 差分が閾値以上の場合は強制シーク
        playerInterface.seekTo(expectedCurrentTime);
      } else {
        // その他の場合は動的速度調整
        const adjustmentRate = calculateAdjustmentRate(timeDiff, syncData.playbackRate);
        applyPlaybackRateAdjustment(adjustmentRate);
      }
    } catch (error) {
      console.warn("[usePlayerSync] Failed to sync:", error);
    }
  }, [
    getExpectedCurrentTime,
    playerInterface,
    syncPlaybackRate,
    calculateAdjustmentRate,
    applyPlaybackRateAdjustment,
    isAdjusting,
  ]);

  useEffect(() => {
    const _isNeedLoopAdjust = () => {
      const syncData = syncDataRef.current;
      if (syncData.loopStart == null || syncData.loopEnd == null) {
        return false;
      }
      const expectedCurrentTime = getExpectedCurrentTime();
      if (expectedCurrentTime === null) {
        return false;
      }
      return syncData.loopEnd < expectedCurrentTime;
    };

    const _calculateLoopAdjustTime = () => {
      const syncData = syncDataRef.current;
      if (syncData.loopStart == null || syncData.loopEnd == null) {
        throw new Error("loopStart or loopEnd is not set");
      }
      return (syncData.loopEnd - syncData.loopStart) * 1000 * (1 / syncData.playbackRate);
    };

    let animationFrameId = 0;
    const loop = () => {
      const syncData = syncDataRef.current;

      if (!syncData.paused) {
        if (_isNeedLoopAdjust()) {
          syncData.baseTime += _calculateLoopAdjustTime();
          isSyncingRef.current = true;
        }

        if (isSyncingRef.current) {
          _sync();
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);

    // 定期的に同期処理を開始する
    const interval = setInterval(() => {
      isSyncingRef.current = true;
    }, SYNC_CONFIG.interval);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(interval);
    };
  }, [_sync, getExpectedCurrentTime]);

  /**
   * 同期データの通知
   * タイミング関連のデータが変更された場合に同期処理を開始する
   */
  const notifySyncData = useCallback((syncData: VJSyncData) => {
    const beforeSyncData = syncDataRef.current;

    const needTimingSync =
      syncData.baseTime !== beforeSyncData.baseTime ||
      syncData.currentTime !== beforeSyncData.currentTime ||
      syncData.playbackRate !== beforeSyncData.playbackRate;

    syncDataRef.current = syncData;
    if (needTimingSync) {
      isSyncingRef.current = true;
    }
  }, []);

  return {
    getCurrentTime: getExpectedCurrentTime,
    setDuration,
    notifySyncData,
    isSyncing: isSyncingRef.current,
  };
};
