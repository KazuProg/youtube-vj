import Fader from "@/components/Fader";
import { useCallback, useEffect, useRef, useState } from "react";
import SeekBar from "./components/SeekBar";
import VJPlayerForController from "./components/VJPlayerForController";
import styles from "./index.module.css";
import type { VJControllerRef } from "./types";

interface VJControllerProps {
  localStorageKey: string;
  setGlobalPlayer: (player: VJControllerRef | null) => void;
  className?: string;
}

const VJController = ({ localStorageKey, setGlobalPlayer, className }: VJControllerProps) => {
  const playerRef = useRef<VJControllerRef | null>(null);

  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const getCurrentTime = (): number => {
    return playerRef.current?.getCurrentTime() ?? 0;
  };

  useEffect(() => {
    setGlobalPlayer(playerRef.current ?? null);
  }, [setGlobalPlayer]);

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
          onPlaybackRateChange={setPlaybackRate}
          onVolumeChange={(volume: number, isMuted: boolean) => {
            setVolume(volume);
            setIsMuted(isMuted);
          }}
        />
        <SeekBar
          currentTimeFunc={getCurrentTime}
          durationFunc={() => playerRef.current?.getDuration() ?? 0}
          onSeek={handleSeek}
        />
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
            reverse={true}
            style={{
              width: "50px",
              height: "150px",
            }}
            onChange={(e) => setPlaybackRate(e)}
          />
          <span>{playbackRate.toFixed(2)}x</span>
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
            {volume.toFixed(0)}%
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
