import { useCallback, useEffect, useRef, useState } from "react";
import { useXWinSync } from "../hooks/useXWinSync";
import YTPlayerForController, { type VJControllerRef } from "./VJPlayerForController";

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
  const playerRef = useRef<VJControllerRef | null>(null);
  const [vjController, setVjController] = useState<VJControllerRef | null>(null);

  const { writeToStorage: writeToXWinSync } = useXWinSync(localStorageKey);

  const writeToStorage = useCallback(
    (updates: Partial<Omit<VJSyncData, "videoId" | "lastUpdated">> = {}) => {
      const beforeData = {
        playbackRate: vjController?.playbackRate ?? 1,
        currentTime: vjController?.currentTime ?? 0,
        paused: vjController?.playerState === 2,
      };

      const syncData: VJSyncData = {
        videoId: "42jhMWfKY9Y",
        lastUpdated: Date.now(),
        ...beforeData,
        ...updates,
      };

      writeToXWinSync(syncData);
    },
    [
      writeToXWinSync,
      vjController?.playbackRate,
      vjController?.currentTime,
      vjController?.playerState,
    ]
  );

  // リアルタイム状態更新のコールバック
  const handleStatusChange = useCallback(() => {
    if (playerRef.current) {
      // 新しいオブジェクトを作成して状態更新を確実に行う
      setVjController({ ...playerRef.current });
    }
  }, []);

  // 初回設定
  useEffect(() => {
    if (playerRef.current) {
      setVjController(playerRef.current);
    }
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
        syncKey={localStorageKey}
        onStatusChange={handleStatusChange}
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
              backgroundColor: vjController?.playerState === 1 ? "#f44336" : "#4CAF50",
            }}
            onClick={() =>
              vjController?.playerState === 1
                ? writeToStorage({ paused: true })
                : writeToStorage({ paused: false })
            }
          >
            {vjController?.playerState === 1 ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            style={{
              ...buttonStyle,
              backgroundColor: vjController?.isMuted ? "#2196F3" : "#ff9800",
            }}
            onClick={() => {
              const newMuted = !vjController?.isMuted;
              if (newMuted) {
                vjController?.mute();
              } else {
                vjController?.unMute();
              }
            }}
          >
            {vjController?.isMuted ? "Unmute" : "Mute"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "20px" }}>
          <label>
            進捗:{" "}
            <input
              type="range"
              min="0"
              max={vjController?.duration ?? 0}
              value={vjController?.currentTime ?? 0}
              onChange={(e) => writeToStorage({ currentTime: Number(e.target.value) })}
            />
          </label>
          <label>
            音量:{" "}
            <input
              type="range"
              min="0"
              max="100"
              value={vjController?.volume ?? 100}
              onChange={(e) => {
                const newVolume = Number(e.target.value);
                vjController?.setVolume(newVolume);
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
              value={vjController?.playbackRate ?? 1}
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
            状態: <strong>{getStateText(vjController?.playerState ?? 0)}</strong>
          </div>
          <div>
            速度: <strong>{vjController?.playbackRate}x</strong>
          </div>
          <div>
            音量: <strong>{Math.round(vjController?.volume ?? 0)}%</strong>
          </div>
          <div>
            ミュート:{" "}
            <strong style={{ color: vjController?.isMuted ? "#f44336" : "#4CAF50" }}>
              {vjController?.isMuted ? "ON" : "OFF"}
            </strong>
          </div>
          <div>
            時間:{" "}
            <strong>
              {Math.round(vjController?.currentTime ?? 0)}s /{" "}
              {Math.round(vjController?.duration ?? 0)}s
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeController;
