import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import YouTube from "react-youtube";
import type { Options, YouTubePlayer as YTPlayerTypes } from "youtube-player/dist/types";
import { useXWinSync } from "../hooks/useXWinSync";
import type { PlayerStatus, VJPlayerProps, VJPlayerRef, VJSyncData } from "../types/vj";
import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "../types/vj";

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
    const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);
    const syncIntervalRef = useRef<number | null>(null);

    const [playerState, setPlayerState] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
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
      if (!playerRef.current || syncDataRef.current.lastUpdated === 0) {
        return null;
      }

      if (syncDataRef.current.paused) {
        return syncDataRef.current.currentTime;
      }

      const timeSinceUpdate = (Date.now() - syncDataRef.current.lastUpdated) / 1000;
      const adjustedTime =
        syncDataRef.current.currentTime + timeSinceUpdate * syncDataRef.current.playbackRate;

      return adjustedTime;
    }, []);

    // 現在時間の更新ループ
    const updateCurrentTime = useCallback(() => {
      const currentTime = getCurrentTime();
      if (currentTime === null) {
        return;
      }
      setCurrentTime(currentTime);

      animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
    }, [getCurrentTime]);

    const syncTiming = useCallback(async () => {
      if (!playerRef.current) {
        return;
      }
      const syncData = syncDataRef.current;

      try {
        // 時間同期
        const expectedCurrentTime = getCurrentTime();
        if (expectedCurrentTime !== null) {
          const currentPlayerTime = await playerRef.current.getCurrentTime();
          const timeDiff = Math.abs(currentPlayerTime - expectedCurrentTime);
          if (timeDiff > DEFAULT_VALUES.seekThreshold) {
            await playerRef.current.seekTo(expectedCurrentTime, true);
          }
        }

        // 再生状態同期
        const currentState = await playerRef.current.getPlayerState();
        if (syncData.paused && currentState === 1) {
          await playerRef.current.pauseVideo();
        } else if (!syncData.paused && currentState === 2) {
          await playerRef.current.playVideo();
        }

        // 再生速度同期
        await playerRef.current.setPlaybackRate(syncData.playbackRate);
      } catch (error) {
        console.error("Error during sync:", error);
      }
    }, [getCurrentTime]);

    // プレイヤー初期化
    const handleReady = useCallback(
      async (event: { target: YTPlayerTypes }) => {
        try {
          // 初期設定
          await event.target.mute();
          await event.target.playVideo();

          const playerDuration = await event.target.getDuration();
          setDuration(playerDuration);

          // 時間更新ループ開始
          updateCurrentTime();

          playerRef.current = event.target;

          const syncData = await readFromStorage();
          if (syncData) {
            handleSyncData(syncData);
          }

          // 定期同期の開始
          syncIntervalRef.current = setInterval(syncTiming, 1000);
        } catch (error) {
          console.error("Error initializing YouTube player:", error);
        }
      },
      [updateCurrentTime, readFromStorage, syncTiming]
    );

    // 同期データの処理
    const handleSyncData = useCallback(
      (syncData: VJSyncData) => {
        console.log("syncData", syncData);
        if (!playerRef.current) {
          return;
        }
        syncDataRef.current = syncData;

        // 即座に同期を実行（定期同期とは別に）
        syncTiming();
      },
      [syncTiming]
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

    // YouTube Player のオプション（メモ化）
    const youtubeOpts = useMemo(
      () => ({
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          // biome-ignore lint/style/useNamingConvention: YouTube API official parameter name
          iv_load_policy: 3,
        },
      }),
      []
    );

    // イベントハンドラーのメモ化
    const handleStateChangeWrapper = useCallback(
      (e: { data: number }) => {
        handleStateChange(e.data);
      },
      [handleStateChange]
    );

    // 状態変更時の通知
    useEffect(() => {
      const status: PlayerStatus = {
        playerState,
        playbackRate: syncDataRef.current.playbackRate,
        currentTime,
        duration,
      };
      notifyStatusChange(status);
    }, [playerState, currentTime, duration, notifyStatusChange]);

    // 再生速度の適用
    useEffect(() => {
      if (playerRef.current) {
        try {
          playerRef.current.setPlaybackRate(syncDataRef.current.playbackRate);
        } catch (error) {
          console.warn("Player not ready for playback rate change:", error);
        }
      }
    }, []);

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
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
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
        getCurrentTime,
      }),
      [currentTime, duration, getCurrentTime]
    );

    return (
      <YouTube
        style={style}
        videoId={videoId}
        opts={youtubeOpts as Options}
        onReady={handleReady}
        onStateChange={handleStateChangeWrapper}
      />
    );
  }
);

VJPlayer.displayName = "VJPlayer";

export default VJPlayer;
