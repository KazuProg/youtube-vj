import VJPlayerForController from "@/components/VJPlayerForController";
import type { PlayerStatus, VJControllerRef } from "@/types/vj";
import { useCallback, useEffect, useRef, useState } from "react";
import Fader from "./Fader";
import SeekBar from "./SeekBar";
import styles from "./VJController.module.css";

interface VJControllerProps {
  localStorageKey: string;
  videoId: string;
  className?: string;
}

const VJController = ({ localStorageKey, videoId, className }: VJControllerProps) => {
  const playerRef = useRef<VJControllerRef | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isDestroyed, setIsDestroyed] = useState(false);

  // 個別の状態管理（必要な値のみ）
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
  const handleStatusChange = useCallback((status: PlayerStatus) => {
    if (!playerRef.current) {
      return;
    }

    // 個別の状態を更新（変更があった場合のみ自動的に更新される）
    setDuration(status.duration);
  }, []);

  // 初期化
  useEffect(() => {
    if (playerRef.current) {
      // 初期状態を設定（変更検知ロジックを通して）
      handleStatusChange({ duration: 0 });

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
          videoId={videoId}
          onPlaybackRateChange={setPlaybackRate}
          onStatusChange={handleStatusChange}
        />
        <SeekBar currentTime={currentTime} duration={duration} onSeek={handleSeek} />
      </fieldset>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          gap: "20px",
        }}
      >
        <fieldset style={{ flex: 1 }}>
          <legend>
            <button
              type="button"
              onClick={() => setPlaybackRate(1)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  setPlaybackRate(1);
                }
              }}
            >
              Speed
            </button>
          </legend>
          <Fader
            min={0.5}
            max={1.5}
            value={playbackRate}
            step={0.01}
            vertical={true}
            style={{
              width: "50px",
              height: "150px",
            }}
            onChange={(e) => setPlaybackRate(e)}
          />
          <span>{playbackRate}x</span>
        </fieldset>
        <fieldset style={{ flex: 1 }}>
          <legend>
            <button
              type="button"
              style={{
                ...(isMuted
                  ? {
                      color: "#f88",
                    }
                  : {}),
              }}
              onClick={() => setIsMuted(!isMuted)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  setIsMuted(!isMuted);
                }
              }}
            >
              Volume
            </button>
          </legend>
          <Fader
            min={0}
            max={100}
            value={volume}
            step={1}
            vertical={true}
            style={{
              width: "50px",
              height: "150px",
            }}
            onChange={(e) => setVolume(e)}
          />
          <span
            style={{
              ...(isMuted
                ? {
                    textDecoration: "line-through",
                  }
                : {}),
            }}
          >
            {volume}%
          </span>
        </fieldset>
      </div>
    </div>
  );
};

export default VJController;
