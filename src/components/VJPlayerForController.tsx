import VJPlayer from "@/components/VJPlayer";
import type {
  VJControllerRef,
  VJPlayerForControllerProps,
  VJPlayerRef,
  VJSyncData,
} from "@/types/vj";
import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "@/types/vj";
import type { YTPlayerEvent } from "@/types/youtube";
import { YT_PLAYER_STATE } from "@/types/youtube";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

const VJPlayerForController = forwardRef<VJControllerRef, VJPlayerForControllerProps>(
  (
    {
      className,
      onStateChange,
      onPlaybackRateChange,
      onVolumeChange,
      syncKey = DEFAULT_VALUES.syncKey,
    },
    ref
  ) => {
    const vjPlayerRef = useRef<VJPlayerRef | null>(null);
    const playerStateRef = useRef<number>(0);
    const isInitializedRef = useRef(false);

    const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);

    const updateSyncData = useCallback(
      (partialSyncData: Partial<VJSyncData>) => {
        const previousSyncData = syncDataRef.current;
        // undefinedの値を除外してマージ
        const filteredPartialData = Object.fromEntries(
          Object.entries(partialSyncData).filter(([_, value]) => value !== undefined)
        );
        const newSyncData = {
          ...previousSyncData,
          ...filteredPartialData,
        } as VJSyncData;
        syncDataRef.current = newSyncData;
        vjPlayerRef.current?.setSyncData(newSyncData);

        if (previousSyncData.playbackRate !== newSyncData.playbackRate) {
          onPlaybackRateChange?.(newSyncData.playbackRate);
        }
      },
      [onPlaybackRateChange]
    );

    const handleStateChange = useCallback(
      (e: YTPlayerEvent) => {
        const playerState = e.data;
        playerStateRef.current = playerState;

        if (playerState === YT_PLAYER_STATE.UNSTARTED) {
          updateSyncData({
            currentTime: 0,
            baseTime: Date.now(),
          });
        }

        if (playerState === YT_PLAYER_STATE.PAUSED && !syncDataRef.current.paused) {
          updateSyncData({
            currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
            baseTime: Date.now(),
            paused: true,
          });
        }
        if (playerState !== YT_PLAYER_STATE.PAUSED && syncDataRef.current.paused) {
          updateSyncData({
            baseTime: Date.now(),
            paused: false,
          });
        }

        if (playerState === YT_PLAYER_STATE.ENDED) {
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
          if (playerStateRef.current === YT_PLAYER_STATE.PAUSED) {
            updateSyncData({
              baseTime: Date.now(),
              paused: false,
            });
          }
        },
        pauseVideo: () => {
          if (playerStateRef.current === YT_PLAYER_STATE.PLAYING) {
            updateSyncData({
              baseTime: Date.now(),
              currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
              paused: true,
            });
          }
        },
        isPlaying: () => {
          return playerStateRef.current === YT_PLAYER_STATE.PLAYING;
        },
        seekTo: (seconds: number, _allowSeekAhead: boolean) => {
          updateSyncData({
            currentTime: seconds,
            baseTime: Date.now(),
          });
        },
        mute: () => {
          vjPlayerRef.current?.getPlayer()?.mute();
          onVolumeChange?.(vjPlayerRef.current?.getPlayer()?.getVolume() ?? 0, true);
        },
        unMute: () => {
          vjPlayerRef.current?.getPlayer()?.unMute();
          onVolumeChange?.(vjPlayerRef.current?.getPlayer()?.getVolume() ?? 0, false);
        },
        isMuted: () => {
          return vjPlayerRef.current?.getPlayer()?.isMuted() ?? false;
        },
        setVolume: (newVolume: number) => {
          vjPlayerRef.current?.getPlayer()?.setVolume(newVolume);
          onVolumeChange?.(newVolume, vjPlayerRef.current?.getPlayer()?.isMuted() ?? false);
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

        playerState: playerStateRef.current,
        playbackRate: syncDataRef.current.playbackRate,
      }),
      [updateSyncData, onVolumeChange]
    );

    return (
      <VJPlayer
        className={className}
        ref={vjPlayerRef}
        onStateChange={handleStateChange}
        syncKey={syncKey}
      />
    );
  }
);

VJPlayerForController.displayName = "VJPlayerForController";

export default VJPlayerForController;
