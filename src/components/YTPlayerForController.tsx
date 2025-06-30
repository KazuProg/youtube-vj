import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import YouTubePlayer, { type YouTubePlayerRef, type PlayerStatus } from "./YouTubePlayer";

// localStorage用の同期データ型（コントローラー用：音量・ミュート含む）
interface VJSyncData {
  videoId: string;
  playbackRate: number;
  currentTime: number;
  lastUpdated: number;
  paused: boolean;
  volume: number;
  isMuted: boolean;
}

interface YTPlayerForControllerProps {
  style?: React.CSSProperties;
  onStatusChange?: (status: PlayerStatus) => void;
  autoLoop?: boolean;
  syncKey?: string;
  videoId?: string;
}

const YTPlayerForController = forwardRef<YouTubePlayerRef, YTPlayerForControllerProps>(
  (
    {
      style,
      onStatusChange,
      autoLoop = true,
      syncKey = "vj-player-default",
      videoId = "42jhMWfKY9Y",
    },
    ref
  ) => {
    const youtubePlayerRef = useRef<YouTubePlayerRef>(null);
    const previousStatus = useRef<PlayerStatus | null>(null);
    const lastSeekTime = useRef<number>(0);

    // localStorageに状態を保存（コントローラー専用）
    const saveToStorage = useCallback(
      (status: PlayerStatus, forceSync = false) => {
        const prev = previousStatus.current;

        // 重要な変更のみ同期（パフォーマンス最適化）
        const shouldSync =
          forceSync ||
          !prev ||
          prev.playerState !== status.playerState || // 再生状態変更
          Math.abs(prev.playbackRate - status.playbackRate) > 0.01 || // 速度変更
          Math.abs(prev.volume - status.volume) > 1 || // 音量変更
          prev.isMuted !== status.isMuted || // ミュート状態変更
          Math.abs(prev.duration - status.duration) > 1; // 動画変更

        if (!shouldSync) {
          return; // 重要でない変更はスキップ
        }

        const syncData: VJSyncData = {
          videoId,
          playbackRate: status.playbackRate,
          currentTime: status.currentTime,
          lastUpdated: Date.now(),
          paused: status.playerState === 2,
          volume: status.volume,
          isMuted: status.isMuted,
        };

        try {
          localStorage.setItem(syncKey, JSON.stringify(syncData));
        } catch (error) {
          console.error("Error saving to localStorage:", error);
        }
      },
      [syncKey, videoId]
    );

    // 手動での再生位置変更時の同期（seekTo操作用）
    const saveSeekPosition = useCallback(
      (currentTime: number) => {
        const now = Date.now();
        // 連続したseek操作を制限（100ms以内は無視）
        if (now - lastSeekTime.current < 100) {
          return;
        }
        lastSeekTime.current = now;

        const currentStatus = previousStatus.current;
        if (!currentStatus) {
          return;
        }

        const syncData: VJSyncData = {
          videoId,
          playbackRate: currentStatus.playbackRate,
          currentTime: currentTime, // 手動変更された位置
          lastUpdated: now,
          paused: currentStatus.playerState === 2,
          volume: currentStatus.volume,
          isMuted: currentStatus.isMuted,
        };

        try {
          localStorage.setItem(syncKey, JSON.stringify(syncData));
        } catch (error) {
          console.error("Error saving seek position:", error);
        }
      },
      [syncKey, videoId]
    );

    const handleStatusChange = useCallback(
      (status: PlayerStatus) => {
        // VJ用: 動画が終了したら自動ループ（オプション有効時）
        if (autoLoop && status.playerState === 0 && youtubePlayerRef.current) {
          try {
            youtubePlayerRef.current.seekTo(0, true);
            youtubePlayerRef.current.playVideo();
          } catch (error) {
            console.error("Error during VJ video loop:", error);
          }
        }

        // 状態をlocalStorageに保存
        saveToStorage(status);

        // 前回の状態を更新
        previousStatus.current = status;

        // 親コンポーネントに状態変更を通知
        onStatusChange?.(status);
      },
      [autoLoop, onStatusChange, saveToStorage]
    );

    // コントローラー用の拡張ref（seek操作時の同期付き）
    useImperativeHandle(
      ref,
      () => {
        const baseRef = youtubePlayerRef.current;
        if (!baseRef) {
          return {
            playVideo: () => {},
            pauseVideo: () => {},
            seekTo: () => {},
            mute: () => {},
            unMute: () => {},
            setVolume: () => {},
            setPlaybackRate: () => {},
            isMuted: false,
            playerState: 0,
            playbackRate: 1,
            volume: 100,
            currentTime: 0,
            duration: 0,
          };
        }

        return {
          ...baseRef,
          // 手動seek操作時は同期位置も更新
          seekTo: (seconds: number, allowSeekAhead: boolean) => {
            baseRef.seekTo(seconds, allowSeekAhead);
            saveSeekPosition(seconds);
          },
        };
      },
      [saveSeekPosition]
    );

    return (
      <YouTubePlayer style={style} ref={youtubePlayerRef} onStatusChange={handleStatusChange} />
    );
  }
);

YTPlayerForController.displayName = "YTPlayerForController";

export default YTPlayerForController;
