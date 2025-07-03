import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useXWinSync } from "../hooks/useXWinSync";
import YTPlayerForVJ from "./VJPlayer";
import type { PlayerStatus, VJPlayerRef } from "./VJPlayer";

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

export interface VJControllerRef {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  isMuted: boolean;
  playerState: number;
  playbackRate: number;
  volume: number;
  currentTime: number;
  duration: number;
}

const YTPlayerForController = forwardRef<VJControllerRef, YTPlayerForControllerProps>(
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
    const vjPlayerRef = useRef<VJPlayerRef | null>(null);
    const previousStatus = useRef<PlayerStatus | null>(null);
    const lastSeekTime = useRef<number>(0);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const { writeToStorage: writeToXWinSync } = useXWinSync(syncKey);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playerState, setPlayerState] = useState<number | null>(null);

    const getPlayer = useCallback(() => {
      return vjPlayerRef.current?.originalPlayer;
    }, []);

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
        if (autoLoop && status.playerState === 0 && vjPlayerRef.current) {
          try {
            saveSeekPosition(0);
            setIsPlaying(true);
          } catch (error) {
            console.error("Error during VJ video loop:", error);
          }
        }

        // 実際のプレイヤー状態をローカル状態に反映
        setPlayerState(status.playerState);
        setPlaybackRate(status.playbackRate);
        setCurrentTime(status.currentTime);
        setDuration(status.duration);

        saveToStorage(status);
        previousStatus.current = status;
        onStatusChange?.(status);
      },
      [autoLoop, onStatusChange, saveToStorage, saveSeekPosition]
    );

    // 状態変更時のリアルタイム通知
    useEffect(() => {
      if (onStatusChange) {
        onStatusChange(
          previousStatus.current || {
            playerState: playerState ?? 0,
            playbackRate,
            currentTime,
            duration,
          }
        );
      }
    }, [playerState, playbackRate, currentTime, duration, onStatusChange]);

    // 再生速度変更の処理
    useEffect(() => {
      if (vjPlayerRef.current) {
        try {
          getPlayer()?.setPlaybackRate(playbackRate);
        } catch (error) {
          console.warn("Player not ready for playback rate change:", error);
        }
      }
    }, [playbackRate, getPlayer]);

    useEffect(() => {
      if (vjPlayerRef.current) {
        if (isMuted) {
          getPlayer()?.mute();
        } else {
          getPlayer()?.unMute();
          getPlayer()?.setVolume(volume);
        }
      }
    }, [volume, isMuted, getPlayer]);

    useEffect(() => {
      if (vjPlayerRef.current) {
        if (isPlaying) {
          getPlayer()?.playVideo();
        } else {
          getPlayer()?.pauseVideo();
        }
      }
    }, [isPlaying, getPlayer]);

    useImperativeHandle(
      ref,
      () => ({
        playVideo: () => setIsPlaying(true),
        pauseVideo: () => setIsPlaying(false),
        seekTo: (seconds: number) => saveSeekPosition(seconds),
        mute: () => setIsMuted(true),
        unMute: () => setIsMuted(false),
        setVolume: (volume: number) => setVolume(volume),
        setPlaybackRate: (rate: number) => setPlaybackRate(rate),
        isMuted: isMuted,
        playerState: playerState ?? 0,
        playbackRate: playbackRate,
        volume: volume,
        currentTime: currentTime,
        duration: duration,
      }),
      [isMuted, volume, playbackRate, playerState, currentTime, duration, saveSeekPosition]
    );

    return (
      <YTPlayerForVJ
        style={style}
        ref={vjPlayerRef}
        onStatusChange={handleStatusChange}
        syncKey={syncKey}
      />
    );
  }
);

YTPlayerForController.displayName = "YTPlayerForController";

export default YTPlayerForController;
