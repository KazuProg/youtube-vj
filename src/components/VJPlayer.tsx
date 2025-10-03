import { useXWinSync } from "@/hooks/useXWinSync";
import type { PlayerStatus, VJPlayerProps, VJPlayerRef, VJSyncData } from "@/types/vj";
import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "@/types/vj";
import { type YTPlayer, type YTPlayerEvent, YT_PLAYER_STATE } from "@/types/youtube";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import YouTubePlayer from "./YouTubePlayer";

const VJPlayer = forwardRef<VJPlayerRef, VJPlayerProps>(
  ({ className, onStateChange, onStatusChange, syncKey = DEFAULT_VALUES.syncKey }, ref) => {
    const playerRef = useRef<YTPlayer | null>(null);
    const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);

    const [duration, setDuration] = useState<number>(0);

    const { onXWinSync, readFromStorage } = useXWinSync(syncKey);

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

    const isPlayerReady = useCallback((player: YTPlayer) => {
      try {
        const playerState = player.getPlayerState();
        return playerState !== null && playerState !== undefined;
      } catch {
        return false;
      }
    }, []);

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
      if (!player) {
        return;
      }

      if (!isPlayerReady(player)) {
        return;
      }

      const syncData = syncDataRef.current;

      try {
        syncTime(player);
        syncPlaybackRate(player, syncData);
      } catch {}
    }, [syncTime, syncPlaybackRate, isPlayerReady]);

    const handleReady = useCallback(
      (event: YTPlayerEvent) => {
        const player = event.target;
        try {
          player.mute();

          playerRef.current = player;

          const syncData = readFromStorage();
          if (syncData) {
            player.loadVideoById(syncData.videoId);
            handleSyncData(syncData);
          }
        } catch {}
      },
      [readFromStorage]
    );

    const handleSyncData = useCallback(
      (syncData: VJSyncData) => {
        const player = playerRef.current;
        if (!player) {
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
          player.loadVideoById(syncData.videoId);
        }

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
      [syncTiming, isPlayerReady]
    );

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

        if (newState === YT_PLAYER_STATE.ENDED && playerRef.current) {
          try {
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
          } catch {}
        }

        onStateChange?.(e);
      },
      [onStateChange]
    );

    useEffect(() => {
      const status: PlayerStatus = {
        duration,
      };
      notifyStatusChange(status);
    }, [duration, notifyStatusChange]);

    useEffect(() => {
      return onXWinSync(handleSyncData);
    }, [onXWinSync, handleSyncData]);

    useEffect(() => {
      const interval = setInterval(syncTiming, 1000);
      return () => {
        clearInterval(interval);
      };
    }, [syncTiming]);

    useEffect(() => {
      return () => {
        playerRef.current = null;
      };
    }, []);

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
