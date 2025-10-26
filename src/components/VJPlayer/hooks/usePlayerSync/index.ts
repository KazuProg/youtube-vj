import { INITIAL_SYNC_DATA } from "@/constants";
import { useCallback, useEffect, useRef } from "react";
import type { VJSyncData } from "../../types";

const SYNC_INTERVAL = 1000; // 定期的な同期間隔（ms）
const SEEK_THRESHOLD = 1.0; // 強制シークの閾値（秒）
const SYNC_THRESHOLD = 0.01; // 同期完了の閾値（秒）

/** プレイヤー同期用のインターフェース */
export interface PlayerSyncInterface {
  getCurrentTime: () => number | null;
  getPlaybackRate: () => number | null;
  setPlaybackRate: (rate: number) => void;
  seekTo: (time: number) => void;
  getDuration: () => number | null;
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
 * 汎用的な関数ベースのインターフェースを使用
 */
export const usePlayerSync = (playerInterface: PlayerSyncInterface): UsePlayerSyncReturn => {
  const lastAppliedRateRef = useRef<number>(1.0);
  const isAdjustingRateRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const durationRef = useRef<number | null>(null);
  const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);

  // 期待時間の計算
  const getCurrentTime = useCallback(() => {
    const syncData = syncDataRef.current;

    if (syncData.baseTime === 0) {
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

      const duration = durationRef.current;
      if (duration && adjustedTime > duration) {
        return duration;
      }

      return adjustedTime;
    } catch (error) {
      console.warn("Failed to calculate current time:", error);
      return null;
    }
  }, []);

  // 時間差に基づく速度調整値の計算
  const getRateAdjustment = useCallback((timeDiff: number) => {
    const absTimeDiff = Math.abs(timeDiff);

    // 1.0秒閾値に基づく調整値の計算
    // 時間差が大きいほど大きな調整値を返す
    const maxAdjustment = 0.5; // 最大調整値
    const adjustment = (absTimeDiff / SEEK_THRESHOLD) * maxAdjustment;

    if (timeDiff > 0) {
      // プレイヤーが進みすぎている場合、速度を下げる（負の調整値）
      return -Math.min(adjustment, maxAdjustment);
    }
    // プレイヤーが遅れている場合、速度を上げる（正の調整値）
    return Math.min(adjustment, maxAdjustment);
  }, []);

  // 速度調整値の計算
  const calculateAdjustmentRate = useCallback(
    (timeDiff: number, currentPlaybackRate: number) => {
      const adjustment = getRateAdjustment(timeDiff);
      const newRate = currentPlaybackRate + adjustment;
      return Math.max(0.25, Math.min(2.0, newRate));
    },
    [getRateAdjustment]
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
      const syncData = syncDataRef.current;
      playerInterface.setPlaybackRate(syncData.playbackRate);
      lastAppliedRateRef.current = syncData.playbackRate;
    } catch (error) {
      console.warn("Failed to set playback rate:", error);
    }
  }, [playerInterface]);

  // メインの同期処理（再帰的にrequestAnimationFrameで呼び出される）
  const performSync = useCallback(() => {
    const expectedCurrentTime = getCurrentTime();
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

      if (absTimeDiff <= SYNC_THRESHOLD) {
        // 差分が10ms以下の場合、設定された速度をそのまま使用
        if (!isAdjustingRateRef.current) {
          syncPlaybackRate();
          animationFrameIdRef.current = null;
        }
      } else if (absTimeDiff >= SEEK_THRESHOLD) {
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
    if (animationFrameIdRef.current === null) {
      animationFrameIdRef.current = requestAnimationFrame(() => {
        animationFrameIdRef.current = null;
        performSync();
      });
    }
  }, [
    getCurrentTime,
    playerInterface,
    syncPlaybackRate,
    calculateAdjustmentRate,
    applyPlaybackRateAdjustment,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      performSync();
    }, SYNC_INTERVAL);

    return () => {
      clearInterval(interval);

      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [performSync]);

  return {
    getCurrentTime,
    setDuration: useCallback((duration: number | null) => {
      durationRef.current = duration;
    }, []),
    notifySyncData: (syncData: VJSyncData) => {
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
    performSync,
    isSyncing: animationFrameIdRef.current !== null,
  };
};
