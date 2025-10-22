import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "@/constants";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import YouTubePlayer from "../YouTubePlayer";
import { type YTPlayer, type YTPlayerEvent, YT_PLAYER_STATE } from "../YouTubePlayer/types";
import { type PlayerSyncInterface, usePlayerSync } from "./hooks/usePlayerSync";
import { useStorageSync } from "./hooks/useStorageSync";
import type { VJPlayerRef, VJSyncData } from "./types";

interface VJPlayerProps {
  className?: string;
  onStateChange?: (state: YTPlayerEvent) => void;
  syncKey?: string;
  videoId?: string;
}

const VJPlayer = forwardRef<VJPlayerRef, VJPlayerProps>(
  ({ className, onStateChange, syncKey = DEFAULT_VALUES.syncKey }, ref) => {
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
          } catch {
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
          } catch {
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
          } catch {
            return null;
          }
        },
      }),
      []
    );

    // カスタムフックの使用
    const { getCurrentTime, performSync, setDuration, notifySyncData } = usePlayerSync(
      playerInterface()
    );

    // 同期開始関数を安定化（再レンダリングを防ぐため）
    const performSyncRef = useRef(performSync);
    performSyncRef.current = performSync;

    const handleReady = useCallback((event: YTPlayerEvent) => {
      const player = event.target;
      try {
        player.mute();
        playerRef.current = player;

        if (syncDataRef.current) {
          player.loadVideoById(syncDataRef.current.videoId);
          handleSyncData(syncDataRef.current);
        }

        // プレイヤーが準備できたら同期を開始
        performSyncRef.current();
      } catch {}
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
        if (!player) {
          return;
        }

        const beforeSyncData = syncDataRef.current;
        const changedVideoId = syncData.videoId !== beforeSyncData.videoId;
        const changedTiming =
          syncData.baseTime !== beforeSyncData.baseTime ||
          syncData.currentTime !== beforeSyncData.currentTime;
        const changedSpeed = syncData.playbackRate !== beforeSyncData.playbackRate;
        const changedPaused = syncData.paused !== beforeSyncData.paused;
        const needTimingSync = changedVideoId || changedTiming || changedSpeed || changedPaused;
        syncDataRef.current = syncData;

        if (changedVideoId) {
          player.loadVideoById(syncData.videoId);
        }

        if (syncData.paused) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }

        if (needTimingSync) {
          notifySyncData(syncData);
          performSync();
        }
      },
      [performSync, notifySyncData]
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
        onStateChange?.(e);
      },
      [onStateChange, setDuration]
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
