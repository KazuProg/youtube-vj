import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import YouTube from "react-youtube";
import type { Options, YouTubePlayer as YTPlayerTypes } from "youtube-player/dist/types";
import { useXWinSync } from "../hooks/useXWinSync";
import type { PlayerStatus, VJPlayerProps, VJPlayerRef, VJSyncData } from "../types/vj";
import { DEFAULT_VALUES } from "../types/vj";

const VJPlayer = forwardRef<VJPlayerRef, VJPlayerProps>(
  (
    {
      style,
      onStatusChange,
      autoLoop = true,
      syncKey = DEFAULT_VALUES.syncKey,
      videoId = DEFAULT_VALUES.videoId,
    },
    ref
  ) => {
    const playerRef = useRef<YTPlayerTypes | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastSyncDataRef = useRef<VJSyncData | null>(null);
    const isInitializedRef = useRef(false);
    const baseTimestampRef = useRef<number>(0);
    const baseCurrentTimeRef = useRef<number>(0);
    const playbackRateRef = useRef<number>(DEFAULT_VALUES.playbackRate);

    const [playerState, setPlayerState] = useState<number>(0);
    const [playbackRate, setPlaybackRate] = useState<number>(DEFAULT_VALUES.playbackRate);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [baseTimestamp, setBaseTimestamp] = useState<number>(0);
    const [baseCurrentTime, setBaseCurrentTime] = useState<number>(0);

    const { readFromStorage, onXWinSync } = useXWinSync(syncKey);

    // プレイヤー状態の通知
    const notifyStatusChange = useCallback(
      (status: PlayerStatus) => {
        onStatusChange?.(status);
      },
      [onStatusChange]
    );

    // 現在時間の更新ループ
    const updateCurrentTime = useCallback(() => {
      if (!playerRef.current) {
        return;
      }
      if (!baseTimestampRef.current) {
        return;
      }
      if (!playbackRateRef.current) {
        return;
      }

      const timeSinceUpdate = (Date.now() - baseTimestampRef.current) / 1000;
      const adjustedTime = baseCurrentTimeRef.current + timeSinceUpdate * playbackRateRef.current;

      try {
        setCurrentTime(adjustedTime);
      } catch (error) {
        console.warn("Failed to get current time:", error);
      }

      animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
    }, []);

    // プレイヤー初期化
    const handleReady = useCallback(
      async (event: { target: YTPlayerTypes }) => {
        try {
          playerRef.current = event.target;

          // 初期設定
          await event.target.mute();
          await event.target.playVideo();

          const playerDuration = await event.target.getDuration();
          setDuration(playerDuration);

          // 時間更新ループ開始
          updateCurrentTime();

          isInitializedRef.current = true;

          // 初期同期データの読み込み
          setTimeout(() => {
            const initialData = readFromStorage();
            if (initialData) {
              handleSyncData(initialData);
            }
          }, 3000);
        } catch (error) {
          console.error("Error initializing YouTube player:", error);
        }
      },
      [updateCurrentTime, readFromStorage]
    );

    // 同期データの処理
    const handleSyncData = useCallback(
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Refactoring planned for future iterations
      async (syncData: VJSyncData) => {
        console.log("syncData", syncData);
        if (!playerRef.current || !isInitializedRef.current) {
          return;
        }

        // 重複チェック
        if (lastSyncDataRef.current?.lastUpdated === syncData.lastUpdated) {
          return;
        }

        setBaseTimestamp(syncData.lastUpdated);
        setBaseCurrentTime(syncData.currentTime);
        baseTimestampRef.current = syncData.lastUpdated;
        baseCurrentTimeRef.current = syncData.currentTime;

        try {
          // 時間同期
          const timeSinceUpdate = (Date.now() - syncData.lastUpdated) / 1000;
          const adjustedTime = syncData.paused
            ? syncData.currentTime
            : syncData.currentTime + timeSinceUpdate * syncData.playbackRate;

          const timeDiff = Math.abs(currentTime - adjustedTime);
          if (timeDiff > DEFAULT_VALUES.seekThreshold) {
            await playerRef.current.seekTo(adjustedTime, true);
          }

          // 再生状態同期
          const currentState = await playerRef.current.getPlayerState();
          if (syncData.paused && currentState === 1) {
            await playerRef.current.pauseVideo();
          } else if (!syncData.paused && currentState === 2) {
            await playerRef.current.playVideo();
          }

          // 再生速度同期
          if (Math.abs(playbackRate - syncData.playbackRate) > 0.01) {
            await playerRef.current.setPlaybackRate(syncData.playbackRate);
            setPlaybackRate(syncData.playbackRate);
            playbackRateRef.current = syncData.playbackRate;
          }

          lastSyncDataRef.current = syncData;
        } catch (error) {
          console.error("Error during sync:", error);
        }
      },
      [currentTime, playbackRate]
    );

    // 状態変更処理
    const handleStateChange = useCallback(
      (newState: number) => {
        setPlayerState(newState);

        // 自動ループ処理
        if (autoLoop && newState === 0 && playerRef.current) {
          try {
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
          } catch (error) {
            console.error("Error during auto loop:", error);
          }
        }
      },
      [autoLoop]
    );

    // 再生速度変更処理
    const handlePlaybackRateChange = useCallback((rate: number) => {
      setPlaybackRate(rate);
      playbackRateRef.current = rate;
    }, []);

    // 状態変更時の通知
    useEffect(() => {
      const status: PlayerStatus = {
        playerState,
        playbackRate,
        currentTime,
        duration,
      };
      notifyStatusChange(status);
    }, [playerState, playbackRate, currentTime, duration, notifyStatusChange]);

    // 再生速度の適用
    useEffect(() => {
      if (playerRef.current && isInitializedRef.current) {
        try {
          playerRef.current.setPlaybackRate(playbackRate);
        } catch (error) {
          console.warn("Player not ready for playback rate change:", error);
        }
      }
      playbackRateRef.current = playbackRate;
    }, [playbackRate]);

    // Ref値の同期
    useEffect(() => {
      baseTimestampRef.current = baseTimestamp;
    }, [baseTimestamp]);

    useEffect(() => {
      baseCurrentTimeRef.current = baseCurrentTime;
    }, [baseCurrentTime]);

    // 外部同期リスナー
    useEffect(() => {
      return onXWinSync(handleSyncData);
    }, [onXWinSync, handleSyncData]);

    // クリーンアップ
    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    // Ref API
    useImperativeHandle(
      ref,
      () => ({
        originalPlayer: playerRef.current as YTPlayerTypes,
        currentTime,
        duration,
      }),
      [currentTime, duration]
    );

    return (
      <YouTube
        style={style}
        videoId={videoId}
        opts={
          {
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              // biome-ignore lint/style/useNamingConvention: YouTube API official parameter name
              iv_load_policy: 3,
            },
          } as Options
        }
        onReady={handleReady}
        onStateChange={(e) => handleStateChange(e.data)}
        onPlaybackRateChange={(e) => handlePlaybackRateChange(e.data)}
      />
    );
  }
);

VJPlayer.displayName = "VJPlayer";

export default VJPlayer;
