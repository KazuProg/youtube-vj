import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import YouTube from "react-youtube";
import type { Options, YouTubePlayer as YTPlayerTypes } from "youtube-player/dist/types";

export interface YouTubePlayerRef {
  playVideo: () => void;
  pauseVideo: () => void;
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

export interface PlayerStatus {
  playerState: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
}

interface YouTubePlayerProps {
  onStatusChange?: (status: PlayerStatus) => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ onStatusChange }, ref) => {
    const playerRef = useRef<YTPlayerTypes | null>(null);
    const [playerState, setPlayerState] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // 状態変更時に親コンポーネントに通知 & プレイヤーに反映
    useEffect(() => {
      if (playerRef.current) {
        // プレイヤーに状態を反映
        if (isMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume);
        }
        playerRef.current.setPlaybackRate(playbackRate);
      }

      // 親コンポーネントに通知
      onStatusChange?.({
        playerState,
        playbackRate,
        volume,
        isMuted,
        currentTime,
        duration,
      });
    }, [playerState, playbackRate, volume, isMuted, currentTime, duration, onStatusChange]);

    const handleReady = async (event: { target: YTPlayerTypes }) => {
      playerRef.current = event.target;
      event.target.mute();
      setIsMuted(true);
      event.target.playVideo();
      setDuration(await event.target.getDuration());

      // currentTimeの更新ループ
      const updateCurrentTime = async () => {
        if (playerRef.current) {
          setCurrentTime(await playerRef.current.getCurrentTime());
        }
        requestAnimationFrame(updateCurrentTime);
      };
      updateCurrentTime();
    };

    useImperativeHandle(ref, () => ({
      playVideo: () => playerRef.current?.playVideo(),
      pauseVideo: () => playerRef.current?.pauseVideo(),
      mute: () => setIsMuted(true),
      unMute: () => setIsMuted(false),
      setVolume,
      setPlaybackRate,
      isMuted,
      playerState,
      playbackRate,
      volume,
      currentTime,
      duration,
    }));

    return (
      <YouTube
        videoId="42jhMWfKY9Y"
        opts={
          {
            width: "640",
            height: "360",
            playerVars: { autoplay: 1 },
          } as Options
        }
        onReady={handleReady}
        onStateChange={(e) => setPlayerState(e.data)}
        onPlaybackRateChange={(e) => setPlaybackRate(e.data)}
      />
    );
  }
);

YouTubePlayer.displayName = "YouTubePlayer";

export default YouTubePlayer;
