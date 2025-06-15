import YouTube from "react-youtube";
import { useRef, useImperativeHandle, forwardRef } from "react";

interface YouTubePlayerInstance {
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  getPlayerState: () => number;
}

export interface YouTubePlayerRef {
  play: () => void;
  pause: () => void;
  mute: () => void;
  unmute: () => void;
  setSpeed: (rate: number) => void;
  setVolume: (volume: number) => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerRef>((props, ref) => {
  const playerRef = useRef<YouTubePlayerInstance | null>(null);

  const opts = {
    width: "640",
    height: "360",
    playerVars: {
      autoplay: 1,
    },
  };

  const handleReady = (event: { target: YouTubePlayerInstance }) => {
    playerRef.current = event.target;
    event.target.mute();
    event.target.playVideo();
  };

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

  const handleMute = () => {
    if (playerRef.current) {
      playerRef.current.mute();
    }
  };

  const handleUnmute = () => {
    if (playerRef.current) {
      playerRef.current.unMute();
    }
  };

  const handleSpeedChange = (rate: number) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  const handleVolumeChange = (volume: number) => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  };

  // 親コンポーネントから呼び出し可能なメソッドを公開
  useImperativeHandle(ref, () => ({
    play: handlePlay,
    pause: handlePause,
    mute: handleMute,
    unmute: handleUnmute,
    setSpeed: handleSpeedChange,
    setVolume: handleVolumeChange,
  }));

  return (
    <YouTube
      videoId="42jhMWfKY9Y"
      onReady={handleReady}
      onStateChange={() => {}}
      onError={() => {}}
      opts={opts}
    />
  );
});

YouTubePlayer.displayName = "YouTubePlayer";

export default YouTubePlayer;
