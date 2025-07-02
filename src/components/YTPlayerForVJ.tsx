import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import YouTube from "react-youtube";
import type { Options, YouTubePlayer as YTPlayerTypes } from "youtube-player/dist/types";
import { useXWinSync } from "../hooks/useXWinSync";

export interface YouTubePlayerRef {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  isMuted: boolean;
  playerState: number;
  playbackRate: number;
  volume: number;
  currentTime: number;
  duration: number;
}

export interface PlayerStatus {
  playerState: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
}

interface VJSyncData {
  videoId: string;
  playbackRate: number;
  currentTime: number;
  lastUpdated: number;
  paused: boolean;
}

interface YTPlayerForVJProps {
  style?: React.CSSProperties;
  onStatusChange?: (status: PlayerStatus) => void;
  autoLoop?: boolean; // VJ用: ループ機能のオン/オフ
  syncKey?: string; // 同期用のキー（複数のプレイヤーを区別）
}

const YTPlayerForVJ = forwardRef<YouTubePlayerRef, YTPlayerForVJProps>(
  ({ style, onStatusChange, autoLoop = true, syncKey = "vj-player-default" }, ref) => {
    const playerRef = useRef<YTPlayerTypes | null>(null);
    const [playerState, setPlayerState] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const lastSyncDataRef = useRef<VJSyncData | null>(null);

    // useXWinSyncフックを使用（投影画面は読み取り専用）
    const { readFromStorage, onXWinSync } = useXWinSync(syncKey);

    useEffect(() => {
      if (playerRef.current) {
        try {
          if (isMuted) {
            playerRef.current.mute();
          } else {
            playerRef.current.unMute();
            playerRef.current.setVolume(volume);
          }
          playerRef.current.setPlaybackRate(playbackRate);
        } catch (error) {
          console.warn("Player not ready yet:", error);
        }
      }

      onStatusChange?.({
        playerState,
        playbackRate,
        volume,
        isMuted,
        currentTime,
        duration,
      });
    }, [playerState, playbackRate, volume, isMuted, currentTime, duration, onStatusChange]);

    const handleReady = useCallback(async (event: { target: YTPlayerTypes }) => {
      try {
        playerRef.current = event.target;

        event.target.mute();
        setIsMuted(true);
        event.target.playVideo();

        const duration = await event.target.getDuration();
        setDuration(duration);

        // currentTimeの更新ループ
        const updateCurrentTime = async () => {
          if (playerRef.current) {
            try {
              const currentTime = await playerRef.current.getCurrentTime();
              setCurrentTime(currentTime);
            } catch {
              // Player not ready yet, skip
            }
          }
          requestAnimationFrame(updateCurrentTime);
        };
        updateCurrentTime();
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
      }
    }, []);

    // 時間同期の処理
    const syncTime = useCallback(
      (syncData: VJSyncData) => {
        if (!playerRef.current) {
          return;
        }
        const timeSinceUpdate = (Date.now() - syncData.lastUpdated) / 1000;
        const adjustedCurrentTime = syncData.paused
          ? syncData.currentTime
          : syncData.currentTime + timeSinceUpdate * syncData.playbackRate;

        const timeDiff = Math.abs(currentTime - adjustedCurrentTime);
        if (timeDiff > 1.0) {
          playerRef.current.seekTo(adjustedCurrentTime, true);
        }
      },
      [currentTime]
    );

    // 再生状態同期の処理
    const syncPlayerState = useCallback((syncData: VJSyncData) => {
      if (!playerRef.current) {
        return;
      }

      if (syncData.paused) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }, []);

    const syncPlaybackRate = useCallback(
      (syncData: VJSyncData) => {
        if (Math.abs(playbackRate - syncData.playbackRate) > 0.01) {
          setPlaybackRate(syncData.playbackRate);
        }
      },
      [playbackRate]
    );

    // 同期処理のメイン関数
    const handleSyncData = useCallback(
      (syncData: VJSyncData) => {
        if (!playerRef.current) {
          return;
        }

        // 同じデータなら処理をスキップ（パフォーマンス最適化）
        if (
          lastSyncDataRef.current &&
          lastSyncDataRef.current.lastUpdated === syncData.lastUpdated
        ) {
          return;
        }

        try {
          if (duration <= 0) {
            return;
          }

          syncTime(syncData);
          syncPlayerState(syncData);
          syncPlaybackRate(syncData);
          lastSyncDataRef.current = syncData;
        } catch (error) {
          console.error("Error during sync:", error);
        }
      },
      [syncTime, syncPlayerState, syncPlaybackRate, duration]
    );

    // useXWinSyncからのイベントで同期処理を実行
    useEffect(() => {
      return onXWinSync((syncData) => {
        handleSyncData(syncData);
      });
    }, [onXWinSync, handleSyncData]);

    const handleStatusChange = useCallback(
      (status: PlayerStatus) => {
        if (autoLoop && status.playerState === 0 && playerRef.current) {
          try {
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
          } catch (error) {
            console.error("Error during VJ video loop:", error);
          }
        }

        // 親コンポーネントに状態変更を通知
        onStatusChange?.(status);
      },
      [autoLoop, onStatusChange]
    );

    const handleStateChange = useCallback(
      (data: number) => {
        setPlayerState(data);
        handleStatusChange({
          playerState: data,
          playbackRate,
          volume,
          isMuted,
          currentTime,
          duration,
        });
      },
      [handleStatusChange, playbackRate, volume, isMuted, currentTime, duration]
    );

    useEffect(() => {
      const timeoutId = setTimeout(() => {
        // 初期同期実行
        const initialData = readFromStorage();
        if (initialData) {
          handleSyncData(initialData);
        }

        if (playerRef.current) {
          playerRef.current.mute();
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    }, [readFromStorage, handleSyncData]);

    // 投影画面用のref（基本機能のみ）
    useImperativeHandle(
      ref,
      () => ({
        playVideo: () => playerRef.current?.playVideo(),
        pauseVideo: () => playerRef.current?.pauseVideo(),
        seekTo: (seconds: number, allowSeekAhead: boolean) =>
          playerRef.current?.seekTo(seconds, allowSeekAhead),
        mute: () => setIsMuted(true),
        unMute: () => setIsMuted(false),
        setVolume,
        setPlaybackRate,
        isMuted,
        playerState,
        playbackRate,
        volume,
        currentTime,
        duration,
      }),
      [isMuted, playerState, playbackRate, volume, currentTime, duration]
    );

    return (
      <YouTube
        style={style}
        videoId="42jhMWfKY9Y"
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
        onPlaybackRateChange={(e) => setPlaybackRate(e.data)}
      />
    );
  }
);

YTPlayerForVJ.displayName = "YTPlayerForVJ";

export default YTPlayerForVJ;
