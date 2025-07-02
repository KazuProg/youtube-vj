import { useCallback, useRef, useState } from "react";
import { useXWinSync } from "../hooks/useXWinSync";
import type { PlayerStatus, YouTubePlayerRef } from "./VJPlayer";
import YTPlayerForController from "./VJPlayerForController";

type YouTubeControllerProps = {
  localStorageKey: string;
};

interface VJSyncData {
  videoId: string;
  playbackRate: number;
  currentTime: number;
  lastUpdated: number;
  paused: boolean;
}

const YouTubeController = ({ localStorageKey }: YouTubeControllerProps) => {
  const playerRef = useRef<YouTubePlayerRef>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    playerState: 0,
    playbackRate: 1,
    volume: 100,
    isMuted: true,
    currentTime: 0,
    duration: 0,
  });

  const { writeToStorage: writeToXWinSync } = useXWinSync(localStorageKey);

  const writeToStorage = useCallback(
    (updates: Partial<Omit<VJSyncData, "videoId" | "lastUpdated">> = {}) => {
      const beforeData = {
        playbackRate: playerStatus.playbackRate,
        currentTime: playerStatus.currentTime,
        paused: playerStatus.playerState === 2,
      };

      const syncData: VJSyncData = {
        videoId: "42jhMWfKY9Y",
        lastUpdated: Date.now(),
        ...beforeData,
        ...updates,
      };

      writeToXWinSync(syncData);
    },
    [writeToXWinSync, playerStatus]
  );

  const handleStatusChange = useCallback((status: PlayerStatus) => {
    setPlayerStatus(status);
  }, []);

  const getStateText = (state: number) =>
    ({
      [-1]: "再生前",
      0: "終了",
      1: "再生中",
      2: "一時停止",
      3: "バッファリング",
      5: "頭出し済み",
    })[state] || "不明";

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
      <YTPlayerForController
        style={{ width: "640px", height: "360px" }}
        ref={playerRef}
        onStatusChange={handleStatusChange}
        syncKey={localStorageKey}
      />

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          border: "2px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
          <button
            type="button"
            style={{
              ...buttonStyle,
              backgroundColor: playerStatus.playerState === 1 ? "#f44336" : "#4CAF50",
            }}
            onClick={() =>
              playerStatus.playerState === 1
                ? writeToStorage({ paused: true })
                : writeToStorage({ paused: false })
            }
          >
            {playerStatus.playerState === 1 ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            style={{
              ...buttonStyle,
              backgroundColor: playerStatus.isMuted ? "#2196F3" : "#ff9800",
            }}
            onClick={() => {
              const newMuted = !playerStatus.isMuted;
              if (newMuted) {
                playerRef.current?.mute();
              } else {
                playerRef.current?.unMute();
              }
            }}
          >
            {playerStatus.isMuted ? "Unmute" : "Mute"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "20px" }}>
          <label>
            進捗:{" "}
            <input
              type="range"
              min="0"
              max={playerStatus.duration}
              value={playerStatus.currentTime}
              onChange={(e) => writeToStorage({ currentTime: Number(e.target.value) })}
            />
          </label>
          <label>
            音量:{" "}
            <input
              type="range"
              min="0"
              max="100"
              value={playerStatus.volume}
              onChange={(e) => {
                const newVolume = Number(e.target.value);
                playerRef.current?.setVolume(newVolume);
              }}
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
              onChange={(e) => writeToStorage({ playbackRate: Number(e.target.value) })}
            />
          </label>
        </div>

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
