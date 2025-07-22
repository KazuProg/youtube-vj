import { YT_OPTIONS } from "@/constants";
import { useXWinSync } from "@/hooks/useXWinSync";
import type { PlayerStatus, VJPlayerProps, VJPlayerRef, VJSyncData } from "@/types/vj";
import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "@/types/vj";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import YouTube, { type YouTubeEvent } from "react-youtube";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import type { YouTubePlayer as YTPlayerTypes } from "youtube-player/dist/types";

const VJPlayer = forwardRef<VJPlayerRef, VJPlayerProps>(
  (
    {
      style,
      onStateChange,
      onStatusChange,
      syncKey = DEFAULT_VALUES.syncKey,
      videoId = DEFAULT_VALUES.videoId,
    },
    ref
  ) => {
    const playerRef = useRef<YTPlayerTypes | null>(null);
    const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);

    const [duration, setDuration] = useState<number>(0);

    const { onXWinSync, readFromStorage } = useXWinSync(syncKey);

    // プレイヤー状態の通知
    const notifyStatusChange = useCallback(
      (status: PlayerStatus) => {
        onStatusChange?.(status);
      },
      [onStatusChange]
    );

    const getCurrentTime = useCallback(() => {
      const syncData = syncDataRef.current;

      if (!playerRef.current || syncData.lastUpdated === 0) {
        return null;
      }

      if (syncData.paused) {
        return syncData.currentTime;
      }

      try {
        const timeSinceUpdate = (Date.now() - syncData.lastUpdated) / 1000;
        const adjustedTime = syncData.currentTime + timeSinceUpdate * syncData.playbackRate;

        return adjustedTime;
      } catch (error) {
        console.warn("Failed to calculate current time:", error);
        return null;
      }
    }, []);

    const syncTiming = useCallback(async () => {
      const player = playerRef.current;
      if (!player) {
        return;
      }
      const syncData = syncDataRef.current;

      try {
        // 時間同期
        const expectedCurrentTime = getCurrentTime();
        if (expectedCurrentTime !== null) {
          const currentPlayerTime = await player.getCurrentTime();
          const timeDiff = Math.abs(currentPlayerTime - expectedCurrentTime);
          if (timeDiff > DEFAULT_VALUES.seekThreshold) {
            await player.seekTo(expectedCurrentTime, true);
          }
        }

        // 再生速度同期
        await player.setPlaybackRate(syncData.playbackRate);
      } catch (error) {
        console.error("Error during sync:", error);
      }
    }, [getCurrentTime]);

    // プレイヤー初期化
    const handleReady = useCallback(
      async (event: { target: YTPlayerTypes }) => {
        const player = event.target;
        try {
          // 初期設定
          await player.mute();
          await player.playVideo();

          const playerDuration = await player.getDuration();
          setDuration(playerDuration);

          playerRef.current = player;

          const syncData = await readFromStorage();
          if (syncData) {
            handleSyncData(syncData);
          }
        } catch (error) {
          console.error("Error initializing YouTube player:", error);
        }
      },
      [readFromStorage]
    );

    // 同期データの処理
    const handleSyncData = useCallback(
      (syncData: VJSyncData) => {
        console.log("syncData", syncData);
        const player = playerRef.current;
        if (!player) {
          return;
        }
        const beforeSyncData = syncDataRef.current;
        const changedTiming = syncData.lastUpdated !== beforeSyncData.lastUpdated;
        const changedSpeed = syncData.playbackRate !== beforeSyncData.playbackRate;
        const changedPaused = syncData.paused !== beforeSyncData.paused;
        const needTimingSync = changedTiming || changedSpeed || changedPaused;
        syncDataRef.current = syncData;

        if (changedPaused) {
          if (syncData.paused) {
            player.pauseVideo();
          } else {
            player.playVideo();
          }
        }
        if (needTimingSync) {
          syncTiming();
        }
      },
      [syncTiming]
    );

    // 状態変更処理
    const handleStateChange = useCallback(
      (e: YouTubeEvent<number>) => {
        const newState = e.data;

        // 自動ループ処理
        if (newState === PlayerStates.ENDED && playerRef.current) {
          try {
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
          } catch (error) {
            console.error("Error during auto loop:", error);
          }
        }

        onStateChange?.(e);
      },
      [onStateChange]
    );

    // ステータス更新の通知
    useEffect(() => {
      const status: PlayerStatus = {
        duration,
      };
      notifyStatusChange(status);
    }, [duration, notifyStatusChange]);

    // 外部同期リスナー
    useEffect(() => {
      return onXWinSync(handleSyncData);
    }, [onXWinSync, handleSyncData]);

    // 定期同期の開始
    useEffect(() => {
      const interval = setInterval(syncTiming, 1000);
      return () => {
        clearInterval(interval);
      };
    }, [syncTiming]);

    // Ref API
    useImperativeHandle(
      ref,
      () => ({
        getPlayer: () => playerRef.current,
        duration,
        getCurrentTime,
      }),
      [duration, getCurrentTime]
    );

    return (
      <YouTube
        style={style}
        videoId={videoId}
        opts={YT_OPTIONS}
        onReady={handleReady}
        onStateChange={handleStateChange}
      />
    );
  }
);

VJPlayer.displayName = "VJPlayer";

export default VJPlayer;
