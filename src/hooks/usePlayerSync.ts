import type { VJSyncData } from "@/types/vj";
import { useCallback, useRef } from "react";

/** プレイヤー同期用のインターフェース */
export interface PlayerSyncInterface {
  getCurrentTime: () => number | null;
  getPlaybackRate: () => number | null;
  setPlaybackRate: (rate: number) => void;
  seekTo: (time: number) => void;
  getDuration: () => number | null;
}

/** カスタムフックのオプション */
export interface UsePlayerSyncOptions {
  syncInterval?: number; // 定期的な同期間隔（ms）
  realtimeFps?: number; // リアルタイム同期のFPS
  seekThreshold?: number; // 強制シークの閾値（秒）
  syncThreshold?: number; // 同期完了の閾値（秒）
}

/** カスタムフックの戻り値 */
export interface UsePlayerSyncReturn {
  getCurrentTime: () => number | null;
  performSync: () => void;
  beginPeriodicSync: () => void;
  stopPeriodicSync: () => void;
  isSyncing: boolean;
}

/**
 * プレイヤー同期用のカスタムフック
 * 汎用的な関数ベースのインターフェースを使用
 */
export const usePlayerSync = (
  playerInterface: PlayerSyncInterface,
  getSyncData: () => VJSyncData,
  options: UsePlayerSyncOptions = {}
): UsePlayerSyncReturn => {
  const { syncInterval = 1000, seekThreshold = 1.0, syncThreshold = 0.01 } = options;

  const lastAppliedRateRef = useRef<number>(1.0);
  const isAdjustingRateRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const periodicSyncIdRef = useRef<number | null>(null);

  // 期待時間の計算
  const getCurrentTime = useCallback(() => {
    const syncData = getSyncData();

    if (!playerInterface.getCurrentTime() || syncData.baseTime === 0) {
      return null;
    }

    if (syncData.paused) {
      return syncData.currentTime;
    }

    try {
      const timeSinceUpdate = (Date.now() - syncData.baseTime) / 1000;
      const adjustedTime = syncData.currentTime + timeSinceUpdate * syncData.playbackRate;

      if (adjustedTime < 0) {
        return 0;
      }

      const playerDuration = playerInterface.getDuration();
      if (playerDuration && adjustedTime > playerDuration) {
        return playerDuration;
      }

      return adjustedTime;
    } catch (error) {
      console.warn("Failed to calculate current time:", error);
      return null;
    }
  }, [getSyncData, playerInterface]);

  // 指数関数的な速度調整の計算
  const getExponentialRateMultiplier = useCallback((timeDiff: number) => {
    const absTimeDiff = Math.abs(timeDiff);
    const base = 1.5;
    const exponent = Math.min(absTimeDiff * 10, 3);

    if (timeDiff > 0) {
      return Math.max(0.25, 1 / base ** exponent);
    }
    return Math.min(2.0, base ** exponent);
  }, []);

  // 速度調整値の計算
  const calculateAdjustmentRate = useCallback(
    (timeDiff: number, currentPlaybackRate: number) => {
      const rateMultiplier = getExponentialRateMultiplier(timeDiff);
      return Math.max(0.25, Math.min(2.0, currentPlaybackRate * rateMultiplier));
    },
    [getExponentialRateMultiplier]
  );

  // 速度調整の適用
  const applyPlaybackRateAdjustment = useCallback(
    (adjustmentRate: number) => {
      try {
        const lastAppliedRate = lastAppliedRateRef.current;

        if (Math.abs(adjustmentRate - lastAppliedRate) >= 0.05) {
          isAdjustingRateRef.current = true;
          playerInterface.setPlaybackRate(adjustmentRate);
          lastAppliedRateRef.current = adjustmentRate;

          setTimeout(() => {
            isAdjustingRateRef.current = false;
          }, 2000);
        }
      } catch (error) {
        console.warn("Failed to set playback rate:", error);
        isAdjustingRateRef.current = false;
      }
    },
    [playerInterface]
  );

  // 同期データの速度適用
  const syncPlaybackRate = useCallback(() => {
    if (isAdjustingRateRef.current) {
      return;
    }

    try {
      const syncData = getSyncData();
      playerInterface.setPlaybackRate(syncData.playbackRate);
      lastAppliedRateRef.current = syncData.playbackRate;
    } catch (error) {
      console.warn("Failed to set playback rate:", error);
    }
  }, [playerInterface, getSyncData]);

  // メインの同期処理（再帰的にrequestAnimationFrameで呼び出される）
  const performSync = useCallback(() => {
    if (!periodicSyncIdRef.current) {
      return;
    }

    const expectedCurrentTime = getCurrentTime();
    if (expectedCurrentTime === null) {
      return;
    }

    try {
      const syncData = getSyncData();
      const currentPlayerTime = playerInterface.getCurrentTime();

      if (currentPlayerTime === null) {
        return;
      }

      const timeDiff = currentPlayerTime - expectedCurrentTime;
      const absTimeDiff = Math.abs(timeDiff);

      if (absTimeDiff <= syncThreshold) {
        // 差分が10ms以下の場合、設定された速度をそのまま使用
        if (!isAdjustingRateRef.current) {
          syncPlaybackRate();
        }
      } else if (absTimeDiff >= seekThreshold) {
        // 差分が1秒以上の場合は強制シーク
        playerInterface.seekTo(expectedCurrentTime);
      } else {
        // その他の場合は動的速度調整
        const adjustmentRate = calculateAdjustmentRate(timeDiff, syncData.playbackRate);
        applyPlaybackRateAdjustment(adjustmentRate);
      }
    } catch (error) {
      console.warn("Failed to sync:", error);
    }

    // 次のフレームで再帰的に呼び出し
    animationFrameIdRef.current = requestAnimationFrame(performSync);
  }, [
    getCurrentTime,
    getSyncData,
    playerInterface,
    syncThreshold,
    seekThreshold,
    syncPlaybackRate,
    calculateAdjustmentRate,
    applyPlaybackRateAdjustment,
  ]);

  // 定期同期の開始
  const beginPeriodicSync = useCallback(() => {
    if (periodicSyncIdRef.current) {
      return;
    }

    // 定期的に同期処理を開始（requestAnimationFrameで再帰的に実行される）
    periodicSyncIdRef.current = setInterval(() => {
      console.log("beginPeriodicSync");
      if (periodicSyncIdRef.current && !animationFrameIdRef.current) {
        performSync();
      }
    }, syncInterval);
  }, [performSync, syncInterval]);

  // 定期同期の停止
  const stopPeriodicSync = useCallback(() => {
    if (periodicSyncIdRef.current) {
      clearInterval(periodicSyncIdRef.current);
      periodicSyncIdRef.current = null;
    }

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, []);

  return {
    getCurrentTime,
    performSync,
    beginPeriodicSync,
    stopPeriodicSync,
    isSyncing: periodicSyncIdRef.current !== null,
  };
};
