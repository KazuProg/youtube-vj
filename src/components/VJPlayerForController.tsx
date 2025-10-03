import VJPlayer from "@/components/VJPlayer";
import { useXWinSync } from "@/hooks/useXWinSync";
import type {
  PlayerStatus,
  VJControllerRef,
  VJPlayerForControllerProps,
  VJPlayerRef,
  VJSyncData,
} from "@/types/vj";
import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "@/types/vj";
import type { YTPlayerEvent } from "@/types/youtube";
import { YT_PLAYER_STATE } from "@/types/youtube";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

const VJPlayerForController = forwardRef<VJControllerRef, VJPlayerForControllerProps>(
  (
    {
      className,
      onStateChange,
      onPlaybackRateChange,
      onStatusChange,
      syncKey = DEFAULT_VALUES.syncKey,
      videoId = DEFAULT_VALUES.videoId,
    },
    ref
  ) => {
    const vjPlayerRef = useRef<VJPlayerRef | null>(null);
    const lastSeekTimeRef = useRef<number>(0);
    const isInitializedRef = useRef(false);

    // プレイヤー状態
    const [duration, setDuration] = useState<number>(0);
    const [playerState, setPlayerState] = useState<number>(0);

    const { writeToStorage: writeToXWinSync } = useXWinSync(syncKey);
    const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);

    // syncDataRefを更新し、同時にwriteToXWinSyncを呼び出す
    const updateSyncData = useCallback(
      (partialSyncData: Partial<VJSyncData>) => {
        const previousSyncData = syncDataRef.current;
        const newSyncData = { ...previousSyncData, ...partialSyncData };
        syncDataRef.current = newSyncData;
        writeToXWinSync(newSyncData);

        if (previousSyncData.playbackRate !== newSyncData.playbackRate) {
          onPlaybackRateChange?.(newSyncData.playbackRate);
        }
      },
      [writeToXWinSync, onPlaybackRateChange]
    );

    // 初期化時のみ実行
    useEffect(() => {
      updateSyncData({ ...INITIAL_SYNC_DATA, videoId });
    }, [updateSyncData, videoId]);

    // シーク位置の保存（デバウンス付き）
    const saveSeekPosition = useCallback(
      (targetTime: number) => {
        const now = Date.now();
        if (now - lastSeekTimeRef.current < DEFAULT_VALUES.seekDebounce) {
          return;
        }
        lastSeekTimeRef.current = now;

        updateSyncData({
          currentTime: targetTime,
          baseTime: now,
        });
      },
      [updateSyncData]
    );

    const handleStateChange = useCallback(
      (e: YTPlayerEvent) => {
        setPlayerState(e.data);

        if (e.data === YT_PLAYER_STATE.UNSTARTED) {
          updateSyncData({
            currentTime: 0,
            baseTime: Date.now(),
          });
        }

        // プレイヤーを直接操作した場合の処理
        if (e.data === YT_PLAYER_STATE.PAUSED && !syncDataRef.current.paused) {
          updateSyncData({
            currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
            baseTime: Date.now(),
            paused: true,
          });
        }
        if (e.data !== YT_PLAYER_STATE.PAUSED && syncDataRef.current.paused) {
          updateSyncData({
            baseTime: Date.now(),
            paused: false,
          });
        }

        onStateChange?.(e);
      },
      [updateSyncData, onStateChange]
    );

    // 子プレイヤーの状態変更処理
    const handleStatusChange = useCallback(
      (status: PlayerStatus) => {
        // 自動ループ処理
        if (playerState === YT_PLAYER_STATE.ENDED) {
          saveSeekPosition(0);
        }

        // 状態の更新
        setDuration(status.duration);

        // 親への通知
        onStatusChange?.(status);
      },
      [onStatusChange, saveSeekPosition, playerState]
    );

    // 初期化完了フラグの設定
    useEffect(() => {
      if (vjPlayerRef.current) {
        isInitializedRef.current = true;
      }
    }, []);

    // 外部API（useImperativeHandle）
    useImperativeHandle(
      ref,
      () => ({
        // 制御メソッド
        playVideo: () => {
          updateSyncData({
            baseTime: Date.now(), // 再生開始時間の記録
            paused: false,
          });
        },
        pauseVideo: () => {
          updateSyncData({
            baseTime: Date.now(),
            currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0, // 一時停止位置の記録
            paused: true,
          });
        },
        seekTo: (seconds: number) => {
          updateSyncData({
            currentTime: seconds,
            baseTime: Date.now(),
          });
        },
        mute: () => vjPlayerRef.current?.getPlayer()?.mute(),
        unMute: () => vjPlayerRef.current?.getPlayer()?.unMute(),
        setVolume: (newVolume: number) => {
          vjPlayerRef.current?.getPlayer()?.setVolume(Math.max(0, Math.min(100, newVolume)));
        },
        setPlaybackRate: (rate: number) => {
          updateSyncData({
            currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
            baseTime: Date.now(),
            playbackRate: rate,
          });
        },
        loadVideoById: (newVideoId: string) => {
          updateSyncData({
            videoId: newVideoId,
            currentTime: 0,
            baseTime: Date.now(),
            paused: false,
          });
        },
        getCurrentTime: () => {
          try {
            return vjPlayerRef.current?.getCurrentTime() ?? null;
          } catch (error) {
            console.warn("Failed to get current time:", error);
            return null;
          }
        },

        // 状態プロパティ,
        playerState,
        playbackRate: syncDataRef.current.playbackRate,
        duration,
      }),
      [playerState, duration, updateSyncData]
    );

    return (
      <VJPlayer
        className={className}
        ref={vjPlayerRef}
        onStateChange={handleStateChange}
        onStatusChange={handleStatusChange}
        syncKey={syncKey}
        videoId={videoId}
      />
    );
  }
);

VJPlayerForController.displayName = "VJPlayerForController";

export default VJPlayerForController;
