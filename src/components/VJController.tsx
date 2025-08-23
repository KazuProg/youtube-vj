import VJPlayerForController from "@/components/VJPlayerForController";
import type { VJControllerRef } from "@/types/vj";
import { PLAYER_STATE_MAP } from "@/types/vj";
import { useCallback, useEffect, useRef, useState } from "react";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import Fader from "./Fader";
import SeekBar from "./SeekBar";
import styles from "./VJController.module.css";

interface VJControllerProps {
  localStorageKey: string;
  className?: string;
}

const VJController = ({ localStorageKey, className }: VJControllerProps) => {
  const playerRef = useRef<VJControllerRef | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isDestroyed, setIsDestroyed] = useState(false);

  // 個別の状態管理（必要な値のみ）
  const [playerState, setPlayerState] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(0);

  const updateController = useCallback(() => {
    if (playerRef.current && !isDestroyed) {
      const currentTime = playerRef.current.getCurrentTime();
      if (currentTime !== null) {
        setCurrentTime(currentTime);
      }
      requestAnimationFrame(updateController);
    }
  }, [isDestroyed]);

  // コントローラー状態の更新（シンプル版）
  const handleStatusChange = useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    const currentController = playerRef.current;

    // 個別の状態を更新（変更があった場合のみ自動的に更新される）
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

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate]);

  useEffect(() => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    }
  }, [isMuted]);

  // 再生/一時停止の切り替え
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    if (playerState === PlayerStates.PAUSED) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [playerState]);

  const handleSeek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
  }, []);

  return (
    <div className={`${styles.container} ${className}`}>
      <fieldset>
        <legend>Preview</legend>
        <VJPlayerForController
          className={styles.player}
          ref={playerRef}
          syncKey={localStorageKey}
          onStateChange={(e) => setPlayerState(e.data)}
          onPlaybackRateChange={setPlaybackRate}
          onStatusChange={handleStatusChange}
        />
        <SeekBar currentTime={currentTime} duration={duration} onSeek={handleSeek} />
      </fieldset>
      <fieldset>
        <legend>Speed({playbackRate}x)</legend>
        <Fader
          min={0.5}
          max={1.5}
          value={playbackRate}
          step={0.01}
          onChange={(e) => setPlaybackRate(e)}
        />
      </fieldset>
      <div className={styles.controlPanel}>
        {/* 制御ボタン */}
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={`${styles.button} ${
              playerState !== PlayerStates.PAUSED ? styles.buttonPause : styles.buttonPlay
            }`}
            onClick={togglePlayPause}
            disabled={!playerRef.current}
          >
            {playerState !== PlayerStates.PAUSED ? "一時停止" : "再生"}
          </button>

          <button
            type="button"
            className={`${styles.button} ${isMuted ? styles.buttonUnmute : styles.buttonMute}`}
            onClick={() => setIsMuted(!isMuted)}
            disabled={!playerRef.current}
          >
            {isMuted ? "ミュート解除" : "ミュート"}
          </button>
        </div>

        {/* スライダー */}
        <div className={styles.sliderGroup}>
          <div className={styles.sliderContainer}>
            <label className={styles.label} htmlFor="volume-slider">
              音量 ({Math.round(volume)}%)
            </label>
            <input
              id="volume-slider"
              type="range"
              className={styles.slider}
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              disabled={!playerRef.current}
            />
          </div>
        </div>

        {/* 状態表示 */}
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>状態: </span>
            <span className={styles.statusValue}>{PLAYER_STATE_MAP[playerState] || "不明"}</span>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>速度: </span>
            <span className={styles.statusValue}>{playbackRate}x</span>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>音量: </span>
            <span className={styles.statusValue}>{Math.round(volume)}%</span>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>ミュート: </span>
            <span
              className={`${styles.statusValue} ${
                isMuted ? styles.statusValueMuted : styles.statusValueUnmuted
              }`}
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
