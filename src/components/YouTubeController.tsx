import { useRef } from "react";
import YouTubePlayer, { type YouTubePlayerRef } from "./YouTubePlayer";

const YouTubeController = () => {
  const playerRef = useRef<YouTubePlayerRef>(null);

  const handleExternalPlay = () => {
    playerRef.current?.play();
  };

  const handleExternalPause = () => {
    playerRef.current?.pause();
  };

  const handleExternalMute = () => {
    playerRef.current?.mute();
  };

  const handleExternalUnmute = () => {
    playerRef.current?.unmute();
  };

  const handleExternalSpeedChange = (rate: number) => {
    playerRef.current?.setSpeed(rate);
  };

  const handleExternalVolumeChange = (volume: number) => {
    playerRef.current?.setVolume(volume);
  };

  return (
    <div>
      <h2>YouTube Controller</h2>
      <YouTubePlayer ref={playerRef} />
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          border: "2px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h3>外部制御パネル</h3>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          <button
            onClick={handleExternalPlay}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            外部Play
          </button>
          <button
            onClick={handleExternalPause}
            style={{
              backgroundColor: "#f44336",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            外部Pause
          </button>
          <button
            onClick={handleExternalMute}
            style={{
              backgroundColor: "#ff9800",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            外部Mute
          </button>
          <button
            onClick={handleExternalUnmute}
            style={{
              backgroundColor: "#2196F3",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            外部Unmute
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          <button
            onClick={() => handleExternalSpeedChange(0.25)}
            style={{
              backgroundColor: "#9C27B0",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            0.25x速度
          </button>
          <button
            onClick={() => handleExternalSpeedChange(0.5)}
            style={{
              backgroundColor: "#9C27B0",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            0.5x速度
          </button>
          <button
            onClick={() => handleExternalSpeedChange(1)}
            style={{
              backgroundColor: "#9C27B0",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            通常速度
          </button>
          <button
            onClick={() => handleExternalSpeedChange(2)}
            style={{
              backgroundColor: "#9C27B0",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            2x速度
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => handleExternalVolumeChange(25)}
            style={{
              backgroundColor: "#607D8B",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            音量25%
          </button>
          <button
            onClick={() => handleExternalVolumeChange(50)}
            style={{
              backgroundColor: "#607D8B",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            音量50%
          </button>
          <button
            onClick={() => handleExternalVolumeChange(75)}
            style={{
              backgroundColor: "#607D8B",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            音量75%
          </button>
          <button
            onClick={() => handleExternalVolumeChange(100)}
            style={{
              backgroundColor: "#607D8B",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            音量100%
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeController;
