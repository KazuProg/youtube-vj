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

  // 個別の状態管理（必要な値のみ）
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(0);

  const getCurrentTime = (): number => {
    return playerRef.current?.getCurrentTime() ?? 0;
  };

  // コントローラー状態の更新（シンプル版）
  const handleStatusChange = useCallback((status: PlayerStatus) => {
    // durationが有効な値の場合のみ更新
    if (status.duration > 0) {
      setDuration(status.duration);
    }
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

  // videoIdの変更を監視して動画を切り替え
  useEffect(() => {
    if (playerRef.current && videoId) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);

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
        <SeekBar currentTimeFunc={getCurrentTime} duration={duration} onSeek={handleSeek} />
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
      <fieldset>
        <legend>Seek</legend>
        <div className={styles.seekButtons}>
          <button
            type="button"
            onClick={() => {
              const newTime = getCurrentTime() - 1;
              playerRef.current?.seekTo(newTime, true);
            }}
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => {
              const newTime = getCurrentTime() + 1;
              playerRef.current?.seekTo(newTime, true);
            }}
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => {
              const newTime = getCurrentTime() - 0.1;
              playerRef.current?.seekTo(newTime, true);
            }}
          >
            -0.1
          </button>
          <button
            type="button"
            onClick={() => {
              const newTime = getCurrentTime() + 0.1;
              playerRef.current?.seekTo(newTime, true);
            }}
          >
            +0.1
          </button>
        </div>
      </fieldset>
    </div>
  );
};

export default VJController;
