import { DEFAULT_VALUES } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import YouTubePlayer from "./components/YouTubePlayer";
import {
  type YTPlayer,
  type YTPlayerEvent,
  type YTPlayerVars,
  YT_PLAYER_STATE,
} from "./components/YouTubePlayer/types";
import { type PlayerSyncInterface, usePlayerSync } from "./hooks/usePlayerSync";
import type { VJPlayerRef, VJSyncData } from "./types";

const playerVars: YTPlayerVars = {
  controls: 0,
  disablekb: 1,
};

interface VJPlayerEvents {
  onPaused?: () => void;
  onUnpaused?: () => void;
  onEnded?: () => void;
  onFiltersChange?: (filters: Record<string, string>) => void;
}

interface VJPlayerProps {
  className?: string;
  events?: VJPlayerEvents;
  syncKey?: string;
}

const VJPlayer = forwardRef<VJPlayerRef, VJPlayerProps>(
  ({ className, events, syncKey = DEFAULT_VALUES.syncKey }, ref) => {
    const playerRef = useRef<YTPlayer | null>(null);
    const beforeSyncDataRef = useRef<VJSyncData | null>(null);
    const isSuppressingStateEventsRef = useRef(false);

    // プレイヤーインターフェースの作成
    const playerInterface = useCallback(
      (): PlayerSyncInterface => ({
        getCurrentTime: () => {
          return playerRef.current?.getCurrentTime() ?? null;
        },
        getDuration: () => {
          return playerRef.current?.getDuration() ?? null;
        },
        setPlaybackRate: (rate: number) => {
          const player = playerRef.current;
          if (player && player.getPlayerState() === YT_PLAYER_STATE.PLAYING) {
            player.setPlaybackRate(rate);
            return true;
          }
          return false;
        },
        seekTo: (time: number) => {
          const player = playerRef.current;
          if (player && player.getPlayerState() === YT_PLAYER_STATE.PLAYING) {
            player.seekTo(time);
          }
        },
      }),
      []
    );

    // カスタムフックの使用
    const { getCurrentTime, setDuration, notifySyncData } = usePlayerSync(playerInterface());

    const handleSyncData = useCallback(
      (syncData: VJSyncData) => {
        const player = playerRef.current;
        const beforeSyncData = beforeSyncDataRef.current;

        if (!player) {
          return;
        }

        const changedVideoId = syncData.videoId !== beforeSyncData?.videoId;

        if (changedVideoId) {
          isSuppressingStateEventsRef.current = true;
          if (syncData.paused) {
            player.cueVideoById(syncData.videoId);
          } else {
            player.loadVideoById(syncData.videoId);
          }
        } else {
          if (syncData.paused) {
            player.pauseVideo();
          } else {
            player.playVideo();
          }
        }

        if (syncData.filters !== beforeSyncData?.filters) {
          eventsRef.current?.onFiltersChange?.(syncData.filters);
        }

        notifySyncData(syncData);
        beforeSyncDataRef.current = syncData;
      },
      [notifySyncData]
    );

    const onChangeSyncData = useCallback(
      (syncData: VJSyncData | null) => {
        if (syncData) {
          handleSyncData(syncData);
        }
      },
      [handleSyncData]
    );

    const { dataRef: syncDataRef, setData: setSyncData } = useStorageSync<VJSyncData>(
      syncKey,
      onChangeSyncData
    );

    const handleReady = useCallback(
      (event: YTPlayerEvent) => {
        const player = event.target;
        try {
          player.mute();
          playerRef.current = player;

          if (syncDataRef.current) {
            handleSyncData(syncDataRef.current);
          }
        } catch (error) {
          console.error("[VJPlayer] Failed to initialize player:", error);
        }
      },
      [handleSyncData, syncDataRef]
    );

    useEffect(() => {
      return () => {
        playerRef.current = null;
      };
    }, []);

    const eventsRef = useRef(events);

    // eventsをrefで保持（再初期化を防ぐ）
    useEffect(() => {
      eventsRef.current = events;
    }, [events]);

    const handlePlayerStateEvents = useCallback(
      (playerState: number) => {
        if (playerState === YT_PLAYER_STATE.PAUSED && !syncDataRef.current?.paused) {
          eventsRef.current?.onPaused?.();
        }

        if (playerState !== YT_PLAYER_STATE.PAUSED && syncDataRef.current?.paused) {
          eventsRef.current?.onUnpaused?.();
        }

        if (playerState === YT_PLAYER_STATE.ENDED) {
          eventsRef.current?.onEnded?.();
        }
      },
      [syncDataRef]
    );

    const handleStateChange = useCallback(
      (e: YTPlayerEvent) => {
        const playerState = e.data;

        if (isSuppressingStateEventsRef.current) {
          if (playerState === YT_PLAYER_STATE.BUFFERING) {
            // 初めのBufferingで準備完了とみなす
            // (以後onPausedやonUnpausedを発火させる)
            isSuppressingStateEventsRef.current = false;
          }
          return;
        }

        if (playerState === YT_PLAYER_STATE.PLAYING) {
          setDuration(playerRef.current?.getDuration() ?? null);
        }

        handlePlayerStateEvents(playerState);
      },
      [setDuration, handlePlayerStateEvents]
    );

    useImperativeHandle(
      ref,
      () => ({
        getPlayer: () => playerRef.current,
        getCurrentTime,
        setSyncData,
      }),
      [getCurrentTime, setSyncData]
    );

    const ytPlayerEvents = useMemo(
      () => ({
        onReady: handleReady,
        onStateChange: handleStateChange,
      }),
      [handleReady, handleStateChange]
    );

    return (
      <YouTubePlayer
        className={className}
        videoId={DEFAULT_VALUES.videoId}
        events={ytPlayerEvents}
        playerVars={playerVars}
      />
    );
  }
);

VJPlayer.displayName = "VJPlayer";

export default VJPlayer;
