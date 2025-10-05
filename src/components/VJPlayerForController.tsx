import VJPlayer from "@/components/VJPlayer";
import { useXWinSync } from "@/hooks/useXWinSync";
import type {
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
      syncKey = DEFAULT_VALUES.syncKey,
      videoId = DEFAULT_VALUES.videoId,
    },
    ref
  ) => {
    const vjPlayerRef = useRef<VJPlayerRef | null>(null);
    const isInitializedRef = useRef(false);

    const [playerState, setPlayerState] = useState<number>(0);

    const { writeToStorage: writeToXWinSync } = useXWinSync(syncKey);
    const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);

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

    useEffect(() => {
      updateSyncData({ ...INITIAL_SYNC_DATA, videoId });
    }, [updateSyncData, videoId]);

    const handleStateChange = useCallback(
      (e: YTPlayerEvent) => {
        setPlayerState(e.data);

        if (e.data === YT_PLAYER_STATE.UNSTARTED) {
          updateSyncData({
            currentTime: 0,
            baseTime: Date.now(),
          });
        }

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

        if (e.data === YT_PLAYER_STATE.ENDED) {
          updateSyncData({
            currentTime: 0,
            baseTime: Date.now(),
          });
        }

        onStateChange?.(e);
      },
      [updateSyncData, onStateChange]
    );

    useEffect(() => {
      if (vjPlayerRef.current) {
        isInitializedRef.current = true;
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        playVideo: () => {
          updateSyncData({
            baseTime: Date.now(),
            paused: false,
          });
        },
        pauseVideo: () => {
          updateSyncData({
            baseTime: Date.now(),
            currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
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
            playbackRate: Number.parseFloat(rate.toFixed(2)),
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
        getDuration: () => {
          try {
            return vjPlayerRef.current?.getPlayer()?.getDuration() ?? null;
          } catch (error) {
            console.warn("Failed to get duration:", error);
            return null;
          }
        },

        playerState,
        playbackRate: syncDataRef.current.playbackRate,
      }),
      [playerState, updateSyncData]
    );

    return (
      <VJPlayer
        className={className}
        ref={vjPlayerRef}
        onStateChange={handleStateChange}
        syncKey={syncKey}
        videoId={videoId}
      />
    );
  }
);

VJPlayerForController.displayName = "VJPlayerForController";

export default VJPlayerForController;
