import { useXWinSync } from "@/hooks/useXWinSync";
import type { PlayerStatus, VJPlayerProps, VJPlayerRef, VJSyncData } from "@/types/vj";
import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "@/types/vj";
import { type YTPlayer, type YTPlayerEvent, YT_PLAYER_STATE } from "@/types/youtube";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import YouTubePlayer from "./YouTubePlayer";

const VJPlayer = forwardRef<VJPlayerRef, VJPlayerProps>(
  ({ className, onStateChange, onStatusChange, syncKey = DEFAULT_VALUES.syncKey }, ref) => {
    // console.log("VJPlayer component rendered");
    const playerRef = useRef<YTPlayer | null>(null);
    const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);
    const isPlayerReadyRef = useRef(false);

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

      if (!playerRef.current || syncData.baseTime === 0) {
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

        if (adjustedTime > duration) {
          return duration;
        }

        return adjustedTime;
      } catch (error) {
        console.warn("Failed to calculate current time:", error);
        return null;
      }
    }, [duration]);

    // プレイヤーの準備状態をチェック
    const isPlayerReady = useCallback((player: YTPlayer) => {
      try {
        const playerState = player.getPlayerState();
        // UNSTARTED (0) も準備完了とみなす
        return playerState !== null && playerState !== undefined;
      } catch {
        return false;
      }
    }, []);

    // 時間同期の処理
    const syncTime = useCallback(
      (player: YTPlayer) => {
        const expectedCurrentTime = getCurrentTime();
        if (expectedCurrentTime === null) {
          return;
        }

        if (!isPlayerReady(player)) {
          return;
        }

        if (typeof player.getCurrentTime !== "function" || typeof player.seekTo !== "function") {
          return;
        }

        try {
          const currentPlayerTime = player.getCurrentTime();
          const timeDiff = Math.abs(currentPlayerTime - expectedCurrentTime);
          if (timeDiff > DEFAULT_VALUES.seekThreshold) {
            player.seekTo(expectedCurrentTime, true);
          }
        } catch (seekError) {
          console.warn("Failed to seek video:", seekError);
        }
      },
      [getCurrentTime, isPlayerReady]
    );

    // 再生速度同期の処理
    const syncPlaybackRate = useCallback(
      (player: YTPlayer, syncData: VJSyncData) => {
        if (typeof player.setPlaybackRate === "function") {
          try {
            if (isPlayerReady(player)) {
              player.setPlaybackRate(syncData.playbackRate);
            }
          } catch (playbackRateError) {
            console.warn("Failed to set playback rate:", playbackRateError);
          }
        }
      },
      [isPlayerReady]
    );

    const syncTiming = useCallback(() => {
      const player = playerRef.current;
      if (!player || !isPlayerReadyRef.current) {
        return;
      }

      if (!isPlayerReady(player)) {
        return;
      }

      const syncData = syncDataRef.current;

      try {
        syncTime(player);
        syncPlaybackRate(player, syncData);
      } catch {
        // エラーは無視して処理を継続
      }
    }, [syncTime, syncPlaybackRate, isPlayerReady]);

    // プレイヤー初期化
    const handleReady = useCallback(
      (event: YTPlayerEvent) => {
        const player = event.target;
        try {
          // 初期設定
          if (
            player &&
            typeof player.mute === "function" &&
            typeof player.playVideo === "function"
          ) {
            player.mute();
            player.playVideo();
          }

          if (player && typeof player.getDuration === "function") {
            const playerDuration = player.getDuration();
            setDuration(playerDuration);
          }

          playerRef.current = player;
          isPlayerReadyRef.current = true;

          const syncData = readFromStorage();
          if (syncData && player && typeof player.loadVideoById === "function") {
            player.loadVideoById(syncData.videoId);
            handleSyncData(syncData);
          }
        } catch {
          // エラーは無視して処理を継続
        }
      },
      [readFromStorage]
    );

    // 動画切り替えの処理
    const handleVideoChange = useCallback((player: YTPlayer, syncData: VJSyncData) => {
      if (typeof player.loadVideoById === "function") {
        try {
          isPlayerReadyRef.current = false;

          // 動画切り替え時に currentTime を 0 にリセット
          // これにより UI が適切に更新される
          const currentSyncData = syncDataRef.current;
          syncDataRef.current = {
            ...currentSyncData,
            currentTime: 0,
            baseTime: Date.now(),
          };

          player.loadVideoById(syncData.videoId);

          // 動画読み込み完了を待つために、より短い間隔でチェック
          const checkReady = () => {
            try {
              const playerState = player.getPlayerState();
              // UNSTARTED (0) も準備完了とみなす
              if (playerState !== null && playerState !== undefined) {
                isPlayerReadyRef.current = true;
              } else {
                setTimeout(checkReady, 100); // 100ms間隔でチェック
              }
            } catch {
              // エラーが発生した場合は再試行
              setTimeout(checkReady, 100);
            }
          };
          setTimeout(checkReady, 200); // 200ms後にチェック開始
        } catch {
          isPlayerReadyRef.current = true;
        }
      }
    }, []);

    // 再生/一時停止の処理
    const handlePlayPause = useCallback(
      (player: YTPlayer, syncData: VJSyncData) => {
        if (typeof player.pauseVideo === "function" && typeof player.playVideo === "function") {
          try {
            if (isPlayerReady(player)) {
              if (syncData.paused) {
                player.pauseVideo();
              } else {
                player.playVideo();
              }
            }
          } catch {
            // エラーは無視して処理を継続
          }
        }
      },
      [isPlayerReady]
    );

    // 同期データの処理
    const handleSyncData = useCallback(
      (syncData: VJSyncData) => {
        const player = playerRef.current;
        if (!player || !isPlayerReadyRef.current) {
          return;
        }

        if (!isPlayerReady(player)) {
          return;
        }

        const beforeSyncData = syncDataRef.current;
        const changedVideoId = syncData.videoId !== beforeSyncData.videoId;
        const changedTiming = syncData.currentTime !== beforeSyncData.currentTime;
        const changedSpeed = syncData.playbackRate !== beforeSyncData.playbackRate;
        const changedPaused = syncData.paused !== beforeSyncData.paused;
        const needTimingSync = changedVideoId || changedTiming || changedSpeed || changedPaused;
        syncDataRef.current = syncData;

        if (changedVideoId) {
          handleVideoChange(player, syncData);
        }

        if (changedPaused) {
          handlePlayPause(player, syncData);
        }

        if (needTimingSync) {
          syncTiming();
        }
      },
      [syncTiming, handleVideoChange, handlePlayPause, isPlayerReady]
    );

    // 状態変更処理
    const handleStateChange = useCallback(
      (e: YTPlayerEvent) => {
        const newState = e.data;

        if (newState === YT_PLAYER_STATE.UNSTARTED) {
          setDuration(0);
        }

        if (newState === YT_PLAYER_STATE.PLAYING) {
          const duration = playerRef.current?.getDuration();
          if (duration) {
            setDuration(duration);
          }
        }

        // 自動ループ処理
        if (newState === YT_PLAYER_STATE.ENDED && playerRef.current) {
          try {
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
          } catch {
            // エラーは無視して処理を継続
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

    // 動画切り替えは同期データの変更で処理するため、ここでは処理しない

    // コンポーネントのクリーンアップ
    useEffect(() => {
      return () => {
        isPlayerReadyRef.current = false;
        playerRef.current = null;
      };
    }, []);

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
      <YouTubePlayer
        className={className}
        videoId={DEFAULT_VALUES.videoId}
        onReady={handleReady}
        onStateChange={handleStateChange}
      />
    );
  }
);

VJPlayer.displayName = "VJPlayer";

export default VJPlayer;
