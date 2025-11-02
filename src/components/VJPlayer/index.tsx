import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "@/constants";
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
  onUnstarted?: () => void;
  onPaused?: () => void;
  onUnpaused?: () => void;
  onEnded?: () => void;
}

interface VJPlayerProps {
  className?: string;
  events?: VJPlayerEvents;
  syncKey?: string;
}

const VJPlayer = forwardRef<VJPlayerRef, VJPlayerProps>(
  ({ className, events, syncKey = DEFAULT_VALUES.syncKey }, ref) => {
    const playerRef = useRef<YTPlayer | null>(null);
    const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);
    const { data: syncData, setData: setSyncData } = useStorageSync<VJSyncData>(syncKey);

    // プレイヤーインターフェースの作成
    const playerInterface = useCallback(
      (): PlayerSyncInterface => ({
        getCurrentTime: () => {
          const player = playerRef.current;
          if (!player) {
            return null;
          }
          try {
            return player.getCurrentTime();
          } catch (error) {
            console.error("[VJPlayer] Failed to get current time:", error);
            return null;
          }
        },
        getPlaybackRate: () => {
          const player = playerRef.current;
          if (!player) {
            return null;
          }
          try {
            return player.getPlaybackRate();
          } catch (error) {
            console.error("[VJPlayer] Failed to get playback rate:", error);
            return null;
          }
        },
        setPlaybackRate: (rate: number) => {
          const player = playerRef.current;
          if (player && player.getPlayerState() === YT_PLAYER_STATE.PLAYING) {
            player.setPlaybackRate(rate);
          }
        },
        seekTo: (time: number) => {
          const player = playerRef.current;
          if (player && player.getPlayerState() === YT_PLAYER_STATE.PLAYING) {
            player.seekTo(time, true);
          }
        },
        getDuration: () => {
          const player = playerRef.current;
          if (!player) {
            return null;
          }
          try {
            return player.getDuration();
          } catch (error) {
            console.error("[VJPlayer] Failed to get duration:", error);
            return null;
          }
        },
      }),
      []
    );

    // カスタムフックの使用
    const { getCurrentTime, setDuration, notifySyncData } = usePlayerSync(playerInterface());

    const handleReady = useCallback((event: YTPlayerEvent) => {
      const player = event.target;
      try {
        player.mute();
        playerRef.current = player;

        if (syncDataRef.current) {
          player.loadVideoById(syncDataRef.current.videoId);
          handleSyncData(syncDataRef.current);
        }
      } catch (error) {
        console.error("[VJPlayer] Failed to initialize player:", error);
      }
    }, []);

    // 初期同期データの設定（一度だけ実行）
    const hasInitializedRef = useRef(false);
    useEffect(() => {
      if (syncData && !hasInitializedRef.current) {
        syncDataRef.current = syncData;
        hasInitializedRef.current = true;
      }
    }, [syncData]);

    const handleSyncData = useCallback(
      (syncData: VJSyncData) => {
        const player = playerRef.current;
        const beforeSyncData = syncDataRef.current;

        if (!player) {
          return;
        }

        const changedVideoId = syncData.videoId !== beforeSyncData.videoId;

        syncDataRef.current = syncData;

        if (changedVideoId) {
          player.loadVideoById(syncData.videoId);
        }

        if (syncData.paused) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }

        notifySyncData(syncData);
      },
      [notifySyncData]
    );

    useEffect(() => {
      if (syncData) {
        handleSyncData(syncData);
      }
    }, [syncData, handleSyncData]);

    useEffect(() => {
      return () => {
        playerRef.current = null;
      };
    }, []);

    const handleStateChange = useCallback(
      (e: YTPlayerEvent) => {
        const playerState = e.data;
        if (playerState === YT_PLAYER_STATE.PLAYING) {
          setDuration(playerRef.current?.getDuration() ?? null);
        }

        if (playerState === YT_PLAYER_STATE.UNSTARTED) {
          events?.onUnstarted?.();
        }

        if (playerState === YT_PLAYER_STATE.PAUSED && !syncDataRef.current?.paused) {
          events?.onPaused?.();
        }

        if (playerState !== YT_PLAYER_STATE.PAUSED && syncDataRef.current?.paused) {
          events?.onUnpaused?.();
        }

        if (playerState === YT_PLAYER_STATE.ENDED) {
          events?.onEnded?.();
        }
      },
      [setDuration, events]
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
