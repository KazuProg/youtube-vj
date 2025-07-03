import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import YouTube from "react-youtube";
import type { Options, YouTubePlayer as YTPlayerTypes } from "youtube-player/dist/types";
import { useXWinSync } from "../hooks/useXWinSync";

export interface PlayerStatus {
  playerState: number;
  playbackRate: number;
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
  autoLoop?: boolean;
  syncKey?: string;
}

export interface VJPlayerRef {
  originalPlayer: YTPlayerTypes;
  currentTime: number;
  duration: number;
}

const YTPlayerForVJ = forwardRef<VJPlayerRef, YTPlayerForVJProps>(
  ({ style, onStatusChange, autoLoop = true, syncKey = "vj-player-default" }, ref) => {
    const playerRef = useRef<YTPlayerTypes | null>(null);
    const [playerState, setPlayerState] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const lastSyncDataRef = useRef<VJSyncData | null>(null);
    const { readFromStorage, onXWinSync } = useXWinSync(syncKey);

    useEffect(() => {
      if (playerRef.current) {
        try {
          playerRef.current.setPlaybackRate(playbackRate);
        } catch (error) {
          console.warn("Player not ready yet:", error);
        }
      }

      onStatusChange?.({
        playerState,
        playbackRate,
        currentTime,
        duration,
      });
    }, [playerState, playbackRate, currentTime, duration, onStatusChange]);

    const handleReady = useCallback(async (event: { target: YTPlayerTypes }) => {
      try {
        playerRef.current = event.target;

        event.target.mute();
        event.target.playVideo();

        const duration = await event.target.getDuration();
        setDuration(duration);

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

    const handleSyncData = useCallback(
      (syncData: VJSyncData) => {
        if (!playerRef.current) {
          return;
        }

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
          currentTime,
          duration,
        });
      },
      [handleStatusChange, playbackRate, currentTime, duration]
    );

    useEffect(() => {
      const timeoutId = setTimeout(() => {
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
