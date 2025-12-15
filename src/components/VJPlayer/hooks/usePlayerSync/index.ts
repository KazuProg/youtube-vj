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
  performSync: () => void;
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
  const animationFrameIdRef = useRef<number | null>(null);
  const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);

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
  const performSync = useCallback(() => {
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
          animationFrameIdRef.current = null;
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

    // 次のフレームで再帰的に呼び出し
    if (animationFrameIdRef.current === null) {
      animationFrameIdRef.current = requestAnimationFrame(() => {
        animationFrameIdRef.current = null;
        performSync();
      });
    }
  }, [
    getExpectedCurrentTime,
    playerInterface,
    syncPlaybackRate,
    calculateAdjustmentRate,
    applyPlaybackRateAdjustment,
    isAdjusting,
  ]);

  // 定期的な同期の開始
  useEffect(() => {
    const interval = setInterval(() => {
      performSync();
    }, SYNC_CONFIG.interval);

    return () => {
      clearInterval(interval);

      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [performSync]);

  /**
   * 同期データの通知
   * タイミング関連のデータが変更された場合に同期処理を開始する
   */
  const notifySyncData = useCallback(
    (syncData: VJSyncData) => {
      const beforeSyncData = syncDataRef.current;

      const needTimingSync =
        syncData.baseTime !== beforeSyncData.baseTime ||
        syncData.currentTime !== beforeSyncData.currentTime ||
        syncData.playbackRate !== beforeSyncData.playbackRate;

      syncDataRef.current = syncData;
      if (needTimingSync) {
        performSync();
      }
    },
    [performSync]
  );

  return {
    getCurrentTime: getExpectedCurrentTime,
    setDuration,
    notifySyncData,
    performSync,
    isSyncing: animationFrameIdRef.current !== null,
  };
};
