import { DEFAULT_VALUES } from "@/constants";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { VJPlayerInterface, VJSyncData } from "../../types";
import styles from "./index.module.css";
import type { YTPlayer, YTPlayerEvent, YTPlayerEventHandlers, YTPlayerVars } from "./types";
import { YT_PLAYER_STATE } from "./types";
import { loadYouTubeIFrameAPI } from "./utils";

const playerVars: YTPlayerVars = {
  controls: 0,
  disablekb: 1,
};

export interface YouTubePlayerEvents {
  onPaused?: () => void;
  onUnpaused?: () => void;
  onEnded?: () => void;
}

export interface YouTubePlayerProps {
  className?: string;
  syncData: VJSyncData;
  vjPlayerRef: React.MutableRefObject<VJPlayerInterface | null>;
  setDuration?: (duration: number | null) => void;
  events?: YouTubePlayerEvents;
}

const createVJPlayerInterface = (player: YTPlayer): VJPlayerInterface => ({
  getCurrentTime: () => player.getCurrentTime() ?? null,
  getDuration: () => player.getDuration() ?? null,
  isPlaying: () => player.getPlayerState() === YT_PLAYER_STATE.PLAYING,
  setPlaybackRate: (rate: number) => {
    if (player.getPlayerState() === YT_PLAYER_STATE.PLAYING) {
      player.setPlaybackRate(rate);
      return true;
    }
    return false;
  },
  seekTo: (time: number) => {
    player.seekTo(time);
  },
  play: () => player.playVideo(),
  pause: () => player.pauseVideo(),
  mute: () => player.mute(),
  unMute: () => player.unMute(),
  isMuted: () => player.isMuted(),
  setVolume: (volume: number) => player.setVolume(volume),
  destroy: () => player.destroy(),
});

const YouTubePlayer = ({
  className,
  syncData,
  vjPlayerRef,
  setDuration,
  events,
}: YouTubePlayerProps) => {
  const playerElementId = useId();
  const playerRef = useRef<YTPlayer | null>(null);
  const isInitializedRef = useRef(false);
  const beforeVideoIdRef = useRef<string | null>(null);
  const isSuppressingStateEventsRef = useRef(false);
  const eventsRef = useRef(events);
  const syncDataRef = useRef(syncData);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    syncDataRef.current = syncData;
  }, [syncData]);

  const videoId =
    syncData.source.type === "youtube" ? syncData.source.videoId : DEFAULT_VALUES.videoId;

  const handleReady = useCallback(
    (event: YTPlayerEvent) => {
      const player = event.target;
      player.mute();
      playerRef.current = player;

      const { source, paused } = syncDataRef.current;
      const currentVideoId = source.type === "youtube" ? source.videoId : DEFAULT_VALUES.videoId;
      beforeVideoIdRef.current = currentVideoId;

      vjPlayerRef.current = createVJPlayerInterface(player);

      if (paused) {
        player.cueVideoById(currentVideoId);
      } else {
        player.loadVideoById(currentVideoId);
      }
      isSuppressingStateEventsRef.current = true;
    },
    [vjPlayerRef]
  );

  const notifyStateEvents = useCallback((playerState: number) => {
    const { paused } = syncDataRef.current;
    const ev = eventsRef.current;
    if (playerState === YT_PLAYER_STATE.PAUSED && !paused) {
      ev?.onPaused?.();
    } else if (playerState !== YT_PLAYER_STATE.PAUSED && paused) {
      ev?.onUnpaused?.();
    }
    if (playerState === YT_PLAYER_STATE.ENDED) {
      ev?.onEnded?.();
    }
  }, []);

  const handleStateChange = useCallback(
    (e: YTPlayerEvent) => {
      const playerState = e.data;

      if (isSuppressingStateEventsRef.current) {
        if (playerState === YT_PLAYER_STATE.BUFFERING) {
          isSuppressingStateEventsRef.current = false;
        }
        return;
      }

      if (playerState === YT_PLAYER_STATE.PLAYING) {
        setDuration?.(playerRef.current?.getDuration() ?? null);
      }

      notifyStateEvents(playerState);
    },
    [setDuration, notifyStateEvents]
  );

  const playerEvents = useMemo<YTPlayerEventHandlers>(
    () => ({
      onReady: handleReady,
      onStateChange: handleStateChange,
    }),
    [handleReady, handleStateChange]
  );

  const playerEventsRef = useRef(playerEvents);
  useEffect(() => {
    playerEventsRef.current = playerEvents;
  }, [playerEvents]);

  const initializePlayer = useCallback(async () => {
    try {
      await loadYouTubeIFrameAPI();

      if (isInitializedRef.current) {
        return;
      }
      isInitializedRef.current = true;

      playerRef.current = new window.YT.Player(playerElementId, {
        videoId: DEFAULT_VALUES.videoId,
        playerVars,
        events: playerEventsRef.current,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[YouTubePlayer] Failed to initialize player:", err);
      setError(errorMessage);
      isInitializedRef.current = false;
    }
  }, [playerElementId]);

  useEffect(() => {
    initializePlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      vjPlayerRef.current = null;
      isInitializedRef.current = false;
      setError(null);
    };
  }, [initializePlayer, vjPlayerRef]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const changedVideoId = videoId !== beforeVideoIdRef.current;
    if (!changedVideoId) {
      return;
    }

    isSuppressingStateEventsRef.current = true;
    beforeVideoIdRef.current = videoId;

    const { paused } = syncDataRef.current;
    if (paused) {
      player.cueVideoById(videoId);
    } else {
      player.loadVideoById(videoId);
    }
  }, [videoId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    if (videoId !== beforeVideoIdRef.current) {
      return;
    }

    if (syncData.paused) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }, [videoId, syncData.paused]);

  return (
    <div id={playerElementId} className={className}>
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          {error ? (
            <>
              <p>YouTube Player Error</p>
              <p className={styles.errorMessage}>{error}</p>
            </>
          ) : (
            <p>Loading YouTube Player...</p>
          )}
        </div>
      </div>
    </div>
  );
};

YouTubePlayer.displayName = "YouTubePlayer";

export default YouTubePlayer;
