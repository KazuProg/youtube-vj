import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import UrlVideoPlayer from "./components/UrlVideoPlayer";
import YouTubePlayer from "./components/YouTubePlayer";
import type { YTPlayerVars } from "./components/YouTubePlayer/types";
import { usePlayerSync } from "./hooks/usePlayerSync";
import styles from "./index.module.css";
import type { VJPlayerEvents, VJPlayerInterface, VJPlayerRef, VJSyncData } from "./types";
import { getEffectiveSyncTime } from "./utils";

interface VJPlayerProps {
  className?: string;
  events?: VJPlayerEvents;
  syncKey?: string;
  playerVars?: YTPlayerVars;
}

const VJPlayer = forwardRef<VJPlayerRef, VJPlayerProps>(
  (
    { className, events, syncKey = DEFAULT_VALUES.syncKey, playerVars: playerVarsOverride },
    ref
  ) => {
    const youtubePlayerRef = useRef<VJPlayerInterface | null>(null);
    const urlPlayerRef = useRef<VJPlayerInterface | null>(null);
    const isUrlSourceRef = useRef(false);
    const beforeFiltersRef = useRef<Record<string, string> | null>(null);
    const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA as VJSyncData);
    const defaultSyncData = INITIAL_SYNC_DATA as VJSyncData;

    const { data: syncData, setData: setSyncData } = useStorageSync<VJSyncData>(
      syncKey,
      defaultSyncData
    );

    syncDataRef.current = syncData;
    const isYouTubeSource = syncData.source.type === "youtube";
    const isUrlSource = syncData.source.type === "url";
    isUrlSourceRef.current = isUrlSource;

    const playbackIntent = useMemo(
      () => ({
        startTime: getEffectiveSyncTime(syncData),
        paused: syncData.paused,
        playbackRate: syncData.playbackRate,
      }),
      [syncData]
    );

    const handleUrlMediaReady = useCallback(
      (timing: { currentTime: number; baseTime: number }) => {
        setSyncData({
          ...syncDataRef.current,
          currentTime: timing.currentTime,
          baseTime: timing.baseTime,
        });
      },
      [setSyncData]
    );

    const activePlayerRef = useMemo(
      () =>
        ({
          get current(): VJPlayerInterface | null {
            const player = isUrlSourceRef.current ? urlPlayerRef.current : youtubePlayerRef.current;
            if (!player) {
              return null;
            }
            return {
              ...player,
              seekTo: (time: number) => {
                if (player.isPlaying()) {
                  player.seekTo(time);
                } else if (!syncDataRef.current.paused) {
                  player.seekTo(time);
                  player.play();
                }
              },
            };
          },
        }) as React.MutableRefObject<VJPlayerInterface | null>,
      []
    );

    const getDeckPlayer = useCallback((): VJPlayerInterface | null => {
      const active = activePlayerRef.current;
      if (!active) {
        return null;
      }
      return {
        ...active,
        mute: () => {
          youtubePlayerRef.current?.mute();
          urlPlayerRef.current?.mute();
        },
        unMute: () => {
          youtubePlayerRef.current?.unMute();
          urlPlayerRef.current?.unMute();
        },
        setVolume: (volume: number) => {
          youtubePlayerRef.current?.setVolume(volume);
          urlPlayerRef.current?.setVolume(volume);
        },
      };
    }, [activePlayerRef]);

    const {
      getCurrentTime: getExpectedCurrentTime,
      setDuration,
      notifySyncData,
      markSourceLoaded,
    } = usePlayerSync(activePlayerRef);

    const handleYouTubeInterfaceReady = useCallback((iface: VJPlayerInterface) => {
      youtubePlayerRef.current = iface;
    }, []);

    const handleYouTubeInterfaceClear = useCallback(() => {
      youtubePlayerRef.current = null;
    }, []);

    const handleUrlInterfaceReady = useCallback((iface: VJPlayerInterface) => {
      urlPlayerRef.current = iface;
    }, []);

    const handleUrlInterfaceClear = useCallback(() => {
      urlPlayerRef.current = null;
    }, []);

    useLayoutEffect(() => {
      if (!isYouTubeSource) {
        youtubePlayerRef.current?.pause();
      }
      if (!isUrlSource) {
        urlPlayerRef.current?.pause();
      }
    }, [isYouTubeSource, isUrlSource]);

    useLayoutEffect(() => {
      notifySyncData(syncData);
    }, [syncData, notifySyncData]);

    useEffect(() => {
      if (syncData.filters !== beforeFiltersRef.current) {
        beforeFiltersRef.current = syncData.filters;
        events?.onFiltersChange?.(syncData.filters);
      }
    }, [syncData.filters, events]);

    useImperativeHandle(
      ref,
      () => ({
        getPlayer: getDeckPlayer,
        getCurrentTime: getExpectedCurrentTime,
        setSyncData,
      }),
      [getDeckPlayer, getExpectedCurrentTime, setSyncData]
    );

    const youtubeVideoId =
      isYouTubeSource && syncData.source.type === "youtube" ? syncData.source.videoId : null;
    const urlSource = isUrlSource && syncData.source.type === "url" ? syncData.source.url : null;

    return (
      <div className={className}>
        <div className={styles.blackLayer} />
        <div className={styles.playerLayer} style={{ display: isYouTubeSource ? "block" : "none" }}>
          <YouTubePlayer
            active={isYouTubeSource}
            videoId={youtubeVideoId}
            playbackIntent={playbackIntent}
            onInterfaceReady={handleYouTubeInterfaceReady}
            onInterfaceClear={handleYouTubeInterfaceClear}
            onSourceLoaded={markSourceLoaded}
            onDurationChange={setDuration}
            events={events}
            playerVars={playerVarsOverride}
          />
        </div>
        <div className={styles.playerLayer} style={{ display: isUrlSource ? "block" : "none" }}>
          <UrlVideoPlayer
            active={isUrlSource}
            sourceUrl={urlSource}
            playbackIntent={playbackIntent}
            onInterfaceReady={handleUrlInterfaceReady}
            onInterfaceClear={handleUrlInterfaceClear}
            onSourceLoaded={markSourceLoaded}
            onDurationChange={setDuration}
            onMediaReady={events?.onMediaReady ? handleUrlMediaReady : undefined}
            events={events}
          />
        </div>
      </div>
    );
  }
);

VJPlayer.displayName = "VJPlayer";

export default VJPlayer;
