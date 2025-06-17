import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import YouTube from "react-youtube";
import type { Options, YouTubePlayer as YTPlayerTypes } from "youtube-player/dist/types";

export interface YouTubePlayerRef {
  play: () => void;
  pause: () => void;
  mute: () => void;
  unmute: () => void;
  setSpeed: (rate: number) => void;
  setVolume: (volume: number) => void;
  playerState: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
}

export interface PlayerStatus {
  state: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
}

interface YouTubePlayerProps {
  onStatusChange?: (status: PlayerStatus) => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ onStatusChange }, ref) => {
    const playerRef = useRef<YTPlayerTypes | null>(null);
    const [playerState, setPlayerState] = useState<number>(0);
    const [playbackRate, setPlaybackRate] = useState<number>(1);
    const [volume, setVolume] = useState<number>(100);
    const [isMuted, setIsMuted] = useState<boolean>(false);

    // playerState、playbackRate、volume、isMutedが変更されたときに親コンポーネントに通知
    useEffect(() => {
      if (onStatusChange) {
        const status: PlayerStatus = {
          state: playerState,
          playbackRate: playbackRate,
          volume: volume,
          isMuted: isMuted,
        };
        onStatusChange(status);
      }
    }, [playerState, playbackRate, volume, isMuted, onStatusChange]);

    const opts = {
      width: "640",
      height: "360",
      playerVars: {
        autoplay: 1,
      },
    };

    const handleReady = async (event: { target: YTPlayerTypes }) => {
      playerRef.current = event.target;
      event.target.mute();
      event.target.playVideo();

      // 初期状態を設定
      setPlayerState(1); // 再生中
      setPlaybackRate(1); // 通常速度

      // 初期のvolume/mute状態を取得
      try {
        const initialVolume = await event.target.getVolume();
        const initialMuted = await event.target.isMuted();
        setVolume(initialVolume);
        setIsMuted(initialMuted);
      } catch (error) {
        console.error("Failed to get initial volume/mute state:", error);
      }
    };

    useEffect(() => {
      if (playerRef.current) {
        if (isMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume);
        }
      }
    }, [volume, isMuted]);

    const handlePlay = () => {
      if (playerRef.current) {
        playerRef.current.playVideo();
      }
    };

    const handlePause = () => {
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
    };

    const handleStateChange = (event: { data: number }) => {
      setPlayerState(event.data);
    };

    const handlePlaybackRateChange = (event: { data: number }) => {
      setPlaybackRate(event.data);
    };

    const handleSpeedChange = (rate: number) => {
      if (playerRef.current) {
        playerRef.current.setPlaybackRate(rate);
        setPlaybackRate(rate);
      }
    };

    // 親コンポーネントから呼び出し可能なメソッドを公開
    useImperativeHandle(ref, () => ({
      play: handlePlay,
      pause: handlePause,
      mute: () => setIsMuted(true),
      unmute: () => setIsMuted(false),
      setSpeed: handleSpeedChange,
      setVolume: (volume: number) => setVolume(volume),
      isMuted: isMuted,
      playerState: playerState,
      playbackRate: playbackRate,
      volume: volume,
    }));

    return (
      <YouTube
        videoId="42jhMWfKY9Y"
        opts={opts as Options}
        onReady={handleReady}
        onStateChange={handleStateChange}
        onPlaybackRateChange={handlePlaybackRateChange}
      />
    );
  }
);

YouTubePlayer.displayName = "YouTubePlayer";

export default YouTubePlayer;
