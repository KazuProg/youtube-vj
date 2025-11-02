import { useCallback, useRef } from "react";
import type { RefObject } from "react";
import type { VJSyncData } from "../../types";

/**
 * 時間同期用のカスタムフック
 * 期待される現在時刻を計算する責務を持つ
 */
export const useTimeSync = (syncDataRef: RefObject<VJSyncData>) => {
  const durationRef = useRef<number | null>(null);

  /**
   * 期待される現在時刻を計算する
   * @returns 期待される現在時刻（秒）、計算できない場合は null
   */
  const getExpectedCurrentTime = useCallback((): number | null => {
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
  }, [syncDataRef]);

  /**
   * 動画の長さを設定する
   * @param duration 動画の長さ（秒）
   */
  const setDuration = useCallback((duration: number | null) => {
    durationRef.current = duration;
  }, []);

  return {
    getExpectedCurrentTime,
    setDuration,
  };
};
