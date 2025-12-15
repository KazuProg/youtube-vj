import { SYNC_CONFIG } from "@/constants";
import { useCallback, useRef } from "react";
import type { RefObject } from "react";
import type { VJSyncData } from "../../types";

interface UsePlaybackRateAdjustmentParams {
  syncDataRef: RefObject<VJSyncData>;
  setPlaybackRate: (rate: number) => void;
}

/**
 * 再生速度調整用のカスタムフック
 * 時間差に基づく動的な速度調整ロジックを担当
 */
export const usePlaybackRateAdjustment = ({
  syncDataRef,
  setPlaybackRate,
}: UsePlaybackRateAdjustmentParams) => {
  const lastAppliedRateRef = useRef<number>(1.0);
  const isAdjustingRateRef = useRef<boolean>(false);

  /**
   * 時間差に基づく速度調整値の計算
   * @param timeDiff 時間差（秒）。正の値はプレイヤーが進みすぎている、負の値は遅れている
   * @returns 速度調整値
   */
  const getRateAdjustment = useCallback((timeDiff: number): number => {
    const sign = timeDiff === 0 ? 0 : timeDiff > 0 ? 1 : -1;
    const absTimeDiff = Math.abs(timeDiff);

    const deadZone = SYNC_CONFIG.playbackDeadZone;
    const fullDiff = SYNC_CONFIG.playbackFullDiff;
    const maxAdjustment = SYNC_CONFIG.maxAdjustment;

    if (sign === 0 || absTimeDiff <= deadZone) {
      return 0;
    }

    let magnitude: number;

    if (absTimeDiff >= fullDiff) {
      magnitude = maxAdjustment;
    } else {
      const normalized = (absTimeDiff - deadZone) / (fullDiff - deadZone); // 0〜1
      const eased = normalized ** SYNC_CONFIG.playbackCurveExponent;
      magnitude = maxAdjustment * eased;
    }

    return sign > 0 ? -magnitude : magnitude;
  }, []);

  /**
   * 時間差と現在の再生速度から調整後の速度を計算
   * @param timeDiff 時間差（秒）
   * @param currentPlaybackRate 現在の再生速度
   * @returns 調整後の再生速度
   */
  const calculateAdjustmentRate = useCallback(
    (timeDiff: number, currentPlaybackRate: number): number => {
      const adjustment = getRateAdjustment(timeDiff);
      const newRate = currentPlaybackRate + adjustment;
      return Math.max(SYNC_CONFIG.minPlaybackRate, Math.min(SYNC_CONFIG.maxPlaybackRate, newRate));
    },
    [getRateAdjustment]
  );

  /**
   * 速度調整を適用する
   * @param adjustmentRate 適用する調整後の速度
   */
  const applyPlaybackRateAdjustment = useCallback(
    (adjustmentRate: number) => {
      try {
        const lastAppliedRate = lastAppliedRateRef.current;

        if (Math.abs(adjustmentRate - lastAppliedRate) >= SYNC_CONFIG.rateChangeThreshold) {
          isAdjustingRateRef.current = true;
          setPlaybackRate(adjustmentRate);
          lastAppliedRateRef.current = adjustmentRate;

          setTimeout(() => {
            isAdjustingRateRef.current = false;
          }, SYNC_CONFIG.rateAdjustmentTimeout);
        }
      } catch (error) {
        console.warn("[usePlaybackRateAdjustment] Failed to set playback rate:", error);
        isAdjustingRateRef.current = false;
      }
    },
    [setPlaybackRate]
  );

  /**
   * 同期データに設定された再生速度を適用する
   */
  const syncPlaybackRate = useCallback(() => {
    if (isAdjustingRateRef.current) {
      return;
    }

    try {
      const syncData = syncDataRef.current;
      setPlaybackRate(syncData.playbackRate);
      lastAppliedRateRef.current = syncData.playbackRate;
    } catch (error) {
      console.warn("[usePlaybackRateAdjustment] Failed to set playback rate:", error);
    }
  }, [setPlaybackRate, syncDataRef]);

  /**
   * 速度調整中かどうかを判定
   */
  const isAdjusting = useCallback((): boolean => {
    return isAdjustingRateRef.current;
  }, []);

  return {
    calculateAdjustmentRate,
    applyPlaybackRateAdjustment,
    syncPlaybackRate,
    isAdjusting,
  };
};
