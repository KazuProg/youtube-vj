import { useCallback, useEffect, useRef, useState } from "react";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { useXWinSync } from "../hooks/useXWinSync";
import type { VJControllerRef, VJSyncData } from "../types/vj";
import { DEFAULT_VALUES, PLAYER_STATE_MAP } from "../types/vj";
import VJPlayerForController from "./VJPlayerForController";

interface VJControllerProps {
  localStorageKey: string;
}

// スタイル定数
const STYLES = {
  container: {
    fontFamily: "Arial, sans-serif",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#333",
  },
  player: {
    width: "100%",
    maxWidth: "640px",
    height: "360px",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  controlPanel: {
    marginTop: "20px",
    padding: "20px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const,
    marginBottom: "20px",
  },
  button: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minWidth: "80px",
  },
  sliderGroup: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap" as const,
  },
  sliderContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "5px",
    minWidth: "150px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#555",
  },
  slider: {
    width: "100%",
    height: "8px",
    borderRadius: "4px",
    background: "#ddd",
    outline: "none",
    cursor: "pointer",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginTop: "10px",
  },
  statusItem: {
    padding: "10px",
    backgroundColor: "#fff",
    borderRadius: "6px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
  },
  statusLabel: {
    fontWeight: "bold",
    color: "#666",
  },
  statusValue: {
    fontWeight: "bold",
    color: "#333",
  },
} as const;

const VJController = ({ localStorageKey }: VJControllerProps) => {
  const playerRef = useRef<VJControllerRef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isDestroyed, setIsDestroyed] = useState(false);

  // 個別の状態管理（必要な値のみ）
  const [playerState, setPlayerState] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);

  const { writeToStorage: writeToXWinSync } = useXWinSync(localStorageKey);

  const updateController = useCallback(() => {
    if (playerRef.current && !isDestroyed) {
      const currentTime = playerRef.current.getCurrentTime();
      if (currentTime !== null) {
        setCurrentTime(currentTime);
      }
      requestAnimationFrame(updateController);
    }
  }, [isDestroyed]);

  // ストレージ書き込み
  const writeToStorage = useCallback(
    (updates: Partial<Omit<VJSyncData, "videoId" | "lastUpdated">> = {}) => {
      if (!playerRef.current) {
        return;
      }

      try {
        const syncData: VJSyncData = {
          videoId: DEFAULT_VALUES.videoId,
          lastUpdated: Date.now(),
          playbackRate: playbackRate,
          currentTime: currentTime,
          paused: playerState === PlayerStates.PAUSED,
          ...updates,
        };

        writeToXWinSync(syncData);
        setError(null);
      } catch (error) {
        console.error("Failed to write to storage:", error);
        setError("同期エラーが発生しました");
      }
    },
    [writeToXWinSync, playbackRate, currentTime, playerState]
  );

  // コントローラー状態の更新（シンプル版）
  const handleStatusChange = useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    const currentController = playerRef.current;

    // 個別の状態を更新（変更があった場合のみ自動的に更新される）
    setVolume(currentController.volume);
    setIsMuted(currentController.isMuted);
    setDuration(currentController.duration);
  }, []);

  // 初期化
  useEffect(() => {
    if (playerRef.current) {
      // 初期状態を設定（変更検知ロジックを通して）
      handleStatusChange();

      const frameId = requestAnimationFrame(updateController);

      return () => {
        cancelAnimationFrame(frameId);
      };
    }
  }, [updateController, handleStatusChange]);

  // コンポーネント破棄時のクリーンアップ
  useEffect(() => {
    return () => {
      setIsDestroyed(true);
    };
  }, []);

  // 再生/一時停止の切り替え
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    const isPlaying = playerState === PlayerStates.PLAYING;
    writeToStorage({ paused: isPlaying });
  }, [playerState, writeToStorage]);

  // ミュート/ミュート解除の切り替え
  const toggleMute = useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    if (isMuted) {
      playerRef.current.unMute();
    } else {
      playerRef.current.mute();
    }
  }, [isMuted]);

  // 進捗変更
  const handleProgressChange = useCallback(
    (value: number) => {
      writeToStorage({ currentTime: value });
    },
    [writeToStorage]
  );

  // 音量変更
  const handleVolumeChange = useCallback((value: number) => {
    playerRef.current?.setVolume(value);
  }, []);

  // 速度変更
  const handleSpeedChange = useCallback((value: number) => {
    playerRef.current?.setPlaybackRate(value);
  }, []);

  // 時間のフォーマット
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  // エラー表示
  const ErrorMessage = error ? (
    <div
      style={{
        padding: "10px",
        backgroundColor: "#ffebee",
        border: "1px solid #f44336",
        borderRadius: "4px",
        color: "#c62828",
        marginBottom: "10px",
      }}
    >
      {error}
    </div>
  ) : null;

  return (
    <div style={STYLES.container}>
      <h2 style={STYLES.title}>VJ Controller</h2>

      {ErrorMessage}

      <VJPlayerForController
        style={STYLES.player}
        ref={playerRef}
        syncKey={localStorageKey}
        onStateChange={(e) => setPlayerState(e.data)}
        onPlaybackRateChange={setPlaybackRate}
        onStatusChange={handleStatusChange}
      />

      <div style={STYLES.controlPanel}>
        {/* 制御ボタン */}
        <div style={STYLES.buttonGroup}>
          <button
            type="button"
            style={{
              ...STYLES.button,
              backgroundColor: playerState === PlayerStates.PLAYING ? "#f44336" : "#4CAF50",
            }}
            onClick={togglePlayPause}
            disabled={!playerRef.current}
          >
            {playerState === PlayerStates.PLAYING ? "一時停止" : "再生"}
          </button>

          <button
            type="button"
            style={{
              ...STYLES.button,
              backgroundColor: isMuted ? "#2196F3" : "#ff9800",
            }}
            onClick={toggleMute}
            disabled={!playerRef.current}
          >
            {isMuted ? "ミュート解除" : "ミュート"}
          </button>
        </div>

        {/* スライダー */}
        <div style={STYLES.sliderGroup}>
          <div style={STYLES.sliderContainer}>
            <label style={STYLES.label} htmlFor="progress-slider">
              進捗 ({formatTime(currentTime)} / {formatTime(duration)})
            </label>
            <input
              id="progress-slider"
              type="range"
              style={STYLES.slider}
              min="0"
              max={duration}
              value={currentTime >= 0 ? currentTime : 0}
              onChange={(e) => handleProgressChange(Number(e.target.value))}
              disabled={!playerRef.current}
            />
          </div>

          <div style={STYLES.sliderContainer}>
            <label style={STYLES.label} htmlFor="volume-slider">
              音量 ({Math.round(volume)}%)
            </label>
            <input
              id="volume-slider"
              type="range"
              style={STYLES.slider}
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              disabled={!playerRef.current}
            />
          </div>

          <div style={STYLES.sliderContainer}>
            <label style={STYLES.label} htmlFor="speed-slider">
              速度 ({playbackRate}x)
            </label>
            <input
              id="speed-slider"
              type="range"
              style={STYLES.slider}
              min="0.25"
              max="2"
              step="0.05"
              value={playbackRate}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              disabled={!playerRef.current}
            />
          </div>
        </div>

        {/* 状態表示 */}
        <div style={STYLES.statusGrid}>
          <div style={STYLES.statusItem}>
            <span style={STYLES.statusLabel}>状態: </span>
            <span style={STYLES.statusValue}>{PLAYER_STATE_MAP[playerState] || "不明"}</span>
          </div>

          <div style={STYLES.statusItem}>
            <span style={STYLES.statusLabel}>速度: </span>
            <span style={STYLES.statusValue}>{playbackRate}x</span>
          </div>

          <div style={STYLES.statusItem}>
            <span style={STYLES.statusLabel}>音量: </span>
            <span style={STYLES.statusValue}>{Math.round(volume)}%</span>
          </div>

          <div style={STYLES.statusItem}>
            <span style={STYLES.statusLabel}>ミュート: </span>
            <span
              style={{
                ...STYLES.statusValue,
                color: isMuted ? "#f44336" : "#4CAF50",
              }}
            >
              {isMuted ? "ON" : "OFF"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VJController;
