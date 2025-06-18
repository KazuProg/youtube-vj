import { useCallback, useRef, useState } from "react";
import YouTubePlayer, { type YouTubePlayerRef, type PlayerStatus } from "./YouTubePlayer";

const YouTubeController = () => {
  const playerRef = useRef<YouTubePlayerRef>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    playerState: 0,
    playbackRate: 1,
    volume: 100,
    isMuted: true,
    currentTime: 0,
    duration: 0,
  });

  const handleStatusChange = useCallback((status: PlayerStatus) => {
    setPlayerStatus(status);
  }, []);

  const getStateText = (state: number) =>
    ["終了", "再生中", "一時停止", "バッファリング", "", "頭出し済み"][state + 1] || "不明";

  const buttonStyle = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "4px",
    color: "white",
    cursor: "pointer",
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
        {/* プレイヤー制御 */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
          <button
            type="button"
            style={{ ...buttonStyle, backgroundColor: "#4CAF50" }}
            onClick={() => playerRef.current?.playVideo()}
          >
            Play
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, backgroundColor: "#f44336" }}
            onClick={() => playerRef.current?.pauseVideo()}
          >
            Pause
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, backgroundColor: "#ff9800" }}
            onClick={() => playerRef.current?.mute()}
          >
            Mute
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, backgroundColor: "#2196F3" }}
            onClick={() => playerRef.current?.unMute()}
          >
            Unmute
          </button>
        </div>

        {/* スライダー制御 */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "20px" }}>
          <label>
            進捗:{" "}
            <input
              type="range"
              min="0"
              max={playerStatus.duration}
              value={playerStatus.currentTime}
              readOnly
            />
          </label>
          <label>
            音量:{" "}
            <input
              type="range"
              min="0"
              max="100"
              value={playerStatus.volume}
              onChange={(e) => playerRef.current?.setVolume(Number(e.target.value))}
            />
          </label>
          <label>
            速度:{" "}
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.05"
              value={playerStatus.playbackRate}
              onChange={(e) => playerRef.current?.setPlaybackRate(Number(e.target.value))}
            />
          </label>
        </div>

        {/* 状態表示 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
          }}
        >
          <div>
            状態: <strong>{getStateText(playerStatus.playerState)}</strong>
          </div>
          <div>
            速度: <strong>{playerStatus.playbackRate}x</strong>
          </div>
          <div>
            音量: <strong>{Math.round(playerStatus.volume)}%</strong>
          </div>
          <div>
            ミュート:{" "}
            <strong style={{ color: playerStatus.isMuted ? "#f44336" : "#4CAF50" }}>
              {playerStatus.isMuted ? "ON" : "OFF"}
            </strong>
          </div>
          <div>
            時間:{" "}
            <strong>
              {Math.round(playerStatus.currentTime)}s / {Math.round(playerStatus.duration)}s
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeController;
