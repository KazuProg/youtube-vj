import { useCallback, useRef, useState } from "react";
import YouTubePlayer, { type YouTubePlayerRef, type PlayerStatus } from "./YouTubePlayer";

const YouTubeController = () => {
  const playerRef = useRef<YouTubePlayerRef>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    state: 0,
    playbackRate: 1,
    volume: 100,
    isMuted: false,
  });

  // プレイヤーの状態変更時に呼ばれるコールバック（useCallbackでメモ化）
  const handleStatusChange = useCallback((status: PlayerStatus) => {
    console.log("Status updated:", status);
    setPlayerStatus(status);
  }, []);

  // プレイヤーの状態を文字列に変換する関数
  const getPlayerStateText = (state: number) => {
    switch (state) {
      case -1:
        return "未開始";
      case 0:
        return "終了";
      case 1:
        return "再生中";
      case 2:
        return "一時停止";
      case 3:
        return "バッファリング";
      case 5:
        return "頭出し済み";
      default:
        return "不明";
    }
  };

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
      <YouTubePlayer ref={playerRef} onStatusChange={handleStatusChange} />
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          border: "2px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h3>プレイヤーステータスパネル（リアルタイム）</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px",
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              padding: "10px",
              backgroundColor: "white",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <strong>再生状態:</strong>
            <br />
            <span style={{ fontSize: "18px", color: "#2196F3" }}>
              {getPlayerStateText(playerStatus.state)}
            </span>
          </div>
          <div
            style={{
              padding: "10px",
              backgroundColor: "white",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <strong>再生速度:</strong>
            <br />
            <span style={{ fontSize: "18px", color: "#4CAF50" }}>{playerStatus.playbackRate}x</span>
          </div>
          <div
            style={{
              padding: "10px",
              backgroundColor: "white",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <strong>音量:</strong>
            <br />
            <span style={{ fontSize: "18px", color: "#FF9800" }}>
              {Math.round(playerStatus.volume)}%
            </span>
          </div>
          <div
            style={{
              padding: "10px",
              backgroundColor: "white",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <strong>ミュート:</strong>
            <br />
            <span
              style={{
                fontSize: "18px",
                color: playerStatus.isMuted ? "#f44336" : "#4CAF50",
              }}
            >
              {playerStatus.isMuted ? "ON" : "OFF"}
            </span>
          </div>
        </div>
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
            type="button"
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
            type="button"
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
            type="button"
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
            type="button"
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
            type="button"
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
            type="button"
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
          Volume：
          <input
            type="range"
            min="0"
            max="100"
            value={playerStatus.volume}
            onChange={(e) => handleExternalVolumeChange(Number.parseInt(e.target.value))}
          />
          <button
            type="button"
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
            type="button"
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
      </div>
    </div>
  );
};

export default YouTubeController;
