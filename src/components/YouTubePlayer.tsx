import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import YouTube from "react-youtube";
import type { Options, YouTubePlayer as YTPlayerTypes } from "youtube-player/dist/types";

export interface YouTubePlayerRef {
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

export interface PlayerStatus {
  playerState: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
}

interface YouTubePlayerProps {
  style?: React.CSSProperties;
  onStatusChange?: (status: PlayerStatus) => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ style, onStatusChange }, ref) => {
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
        try {
          // プレイヤーに状態を反映
          if (isMuted) {
            playerRef.current.mute();
          } else {
            playerRef.current.unMute();
            playerRef.current.setVolume(volume);
          }
          playerRef.current.setPlaybackRate(playbackRate);
        } catch (error) {
          console.warn("Player not ready yet:", error);
        }
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
      try {
        playerRef.current = event.target;

        event.target.mute();
        setIsMuted(true);
        event.target.playVideo();

        const duration = await event.target.getDuration();
        setDuration(duration);

        // currentTimeの更新ループ
        const updateCurrentTime = async () => {
          if (playerRef.current) {
            try {
              const currentTime = await playerRef.current.getCurrentTime();
              setCurrentTime(currentTime);
            } catch {
              // プレイヤーがまだ準備できていない場合はスキップ
            }
          }
          requestAnimationFrame(updateCurrentTime);
        };
        updateCurrentTime();
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
      }
    };

    useImperativeHandle(ref, () => ({
      playVideo: () => playerRef.current?.playVideo(),
      pauseVideo: () => playerRef.current?.pauseVideo(),
      seekTo: (seconds: number, allowSeekAhead: boolean) =>
        playerRef.current?.seekTo(seconds, allowSeekAhead),
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
        style={style}
        videoId="42jhMWfKY9Y"
        opts={
          {
            width: "100%",
            height: "100%",
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
