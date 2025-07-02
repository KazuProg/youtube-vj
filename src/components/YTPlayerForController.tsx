import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { useXWinSync } from "../hooks/useXWinSync";
import YTPlayerForVJ from "./YTPlayerForVJ";
import type { PlayerStatus, YouTubePlayerRef } from "./YTPlayerForVJ";

interface VJSyncData {
  videoId: string;
  playbackRate: number;
  currentTime: number;
  lastUpdated: number;
  paused: boolean;
}

interface YTPlayerForControllerProps {
  style?: React.CSSProperties;
  onStatusChange?: (status: PlayerStatus) => void;
  autoLoop?: boolean;
  syncKey?: string;
  videoId?: string;
}

const YTPlayerForController = forwardRef<YouTubePlayerRef, YTPlayerForControllerProps>(
  (
    {
      style,
      onStatusChange,
      autoLoop = true,
      syncKey = "vj-player-default",
      videoId = "42jhMWfKY9Y",
    },
    ref
  ) => {
    const ytPlayerRef = useRef<YouTubePlayerRef>(null);
    const previousStatus = useRef<PlayerStatus | null>(null);
    const lastSeekTime = useRef<number>(0);

    const { writeToStorage: writeToXWinSync } = useXWinSync(syncKey);

    const saveToStorage = useCallback(
      (status: PlayerStatus, forceSync = false) => {
        const prev = previousStatus.current;

        const shouldSync =
          forceSync ||
          !prev ||
          prev.playerState !== status.playerState ||
          Math.abs(prev.playbackRate - status.playbackRate) > 0.01 ||
          Math.abs(prev.duration - status.duration) > 1;

        if (!shouldSync) {
          return;
        }

        const syncData: VJSyncData = {
          videoId,
          playbackRate: status.playbackRate,
          currentTime: status.currentTime,
          lastUpdated: Date.now(),
          paused: status.playerState === 2,
        };

        writeToXWinSync(syncData);
      },
      [writeToXWinSync, videoId]
    );

    const saveSeekPosition = useCallback(
      (currentTime: number) => {
        const now = Date.now();
        if (now - lastSeekTime.current < 100) {
          return;
        }
        lastSeekTime.current = now;

        const currentStatus = previousStatus.current;
        if (!currentStatus) {
          return;
        }

        const syncData: VJSyncData = {
          videoId,
          playbackRate: currentStatus.playbackRate,
          currentTime: currentTime,
          lastUpdated: now,
          paused: currentStatus.playerState === 2,
        };

        writeToXWinSync(syncData);
      },
      [writeToXWinSync, videoId]
    );

    const handleStatusChange = useCallback(
      (status: PlayerStatus) => {
        if (autoLoop && status.playerState === 0 && ytPlayerRef.current) {
          try {
            ytPlayerRef.current.seekTo(0, true);
            ytPlayerRef.current.playVideo();
          } catch (error) {
            console.error("Error during VJ video loop:", error);
          }
        }

        saveToStorage(status);
        previousStatus.current = status;
        onStatusChange?.(status);
      },
      [autoLoop, onStatusChange, saveToStorage]
    );

    useImperativeHandle(
      ref,
      () => {
        const baseRef = ytPlayerRef.current;
        if (!baseRef) {
          return {
            playVideo: () => {},
            pauseVideo: () => {},
            seekTo: () => {},
            mute: () => {},
            unMute: () => {},
            setVolume: () => {},
            setPlaybackRate: () => {},
            isMuted: false,
            playerState: 0,
            playbackRate: 1,
            volume: 100,
            currentTime: 0,
            duration: 0,
          };
        }

        return {
          ...baseRef,
          seekTo: (seconds: number, allowSeekAhead: boolean) => {
            baseRef.seekTo(seconds, allowSeekAhead);
            saveSeekPosition(seconds);
          },
        };
      },
      [saveSeekPosition]
    );

    return (
      <YTPlayerForVJ
        style={style}
        ref={ytPlayerRef}
        onStatusChange={handleStatusChange}
        syncKey={syncKey}
      />
    );
  }
);

YTPlayerForController.displayName = "YTPlayerForController";

export default YTPlayerForController;
