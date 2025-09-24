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
  const seekBarRef = useRef<HTMLDivElement | null>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const lastTimeUpdateRef = useRef<number>(0);
  const [isDestroyed, setIsDestroyed] = useState(false);

  // 個別の状態管理（必要な値のみ）
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(0);

  // 時間フォーマット関数
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // SeekBarのプログレス更新
  const updateSeekBarProgress = useCallback((newCurrentTime: number) => {
    if (!seekBarRef.current) {
      return;
    }

    const position = durationRef.current > 0 ? (newCurrentTime / durationRef.current) * 100 : 0;
    const barElement = seekBarRef.current.querySelector("[data-seek-bar]") as HTMLElement;
    const indicatorElement = seekBarRef.current.querySelector(
      "[data-seek-indicator]"
    ) as HTMLElement;

    // 直接的なDOM更新
    if (barElement) {
      barElement.style.width = `${position}%`;
    }
    if (indicatorElement) {
      indicatorElement.style.left = `${position}%`;
    }
  }, []);

  // SeekBarの時間表示更新
  const updateSeekBarTime = useCallback(
    (newCurrentTime: number, currentDuration?: number) => {
      if (!seekBarRef.current) {
        return;
      }

      const durationToUse = currentDuration ?? duration;

      const timeElement = seekBarRef.current.querySelector("[data-seek-time]") as HTMLElement;
      if (timeElement) {
        const currentTimeSpan = timeElement.querySelector("span:first-child");
        const durationSpan = timeElement.querySelector("span:last-child");

        // 時間表示の更新頻度を制限（0.1秒ごと）
        const now = Date.now();
        if (now - lastTimeUpdateRef.current > 100) {
          if (currentTimeSpan) {
            currentTimeSpan.textContent = formatTime(newCurrentTime);
          }
          lastTimeUpdateRef.current = now;
        }

        if (durationSpan) {
          durationSpan.textContent = formatTime(durationToUse);
        }
      }
    },
    [duration, formatTime]
  );

  // SeekBarの直接更新関数
  const updateSeekBar = useCallback(
    (newCurrentTime: number) => {
      updateSeekBarProgress(newCurrentTime);
      updateSeekBarTime(newCurrentTime, durationRef.current);
    },
    [updateSeekBarProgress, updateSeekBarTime]
  );

  const updateController = useCallback(() => {
    if (isDestroyed) {
      return;
    }

    if (!playerRef.current) {
      requestAnimationFrame(updateController);
      return;
    }

    try {
      // プレイヤーの状態をチェック
      const playerState = playerRef.current.playerState;
      const newCurrentTime = playerRef.current.getCurrentTime();

      // UNSTARTED (0) の場合は currentTime を更新しない
      // currentTime が null の場合は更新しない（動画切り替え中など）
      if (playerState !== 0 && newCurrentTime !== null) {
        // シンプルな更新（フレームレート制御なし）
        currentTimeRef.current = newCurrentTime;
        updateSeekBar(newCurrentTime);
      }
    } catch {
      // プレイヤーが一時的に利用できない場合（動画切り替え時など）
      // エラーは無視して requestAnimationFrame を継続
    }

    // プレイヤーが利用できない場合でも requestAnimationFrame を継続
    requestAnimationFrame(updateController);
  }, [isDestroyed, updateSeekBar]);

  // コントローラー状態の更新（シンプル版）
  const handleStatusChange = useCallback(
    (status: PlayerStatus) => {
      // durationが有効な値の場合のみ更新
      if (status.duration > 0) {
        setDuration(status.duration);
        durationRef.current = status.duration; // refも更新
        // SeekBarの時間表示も更新（最新のduration値を渡す）
        if (seekBarRef.current) {
          updateSeekBarTime(currentTimeRef.current, status.duration);
        }
      }
    },
    [updateSeekBarTime]
  );

  // 初期化
  useEffect(() => {
    // プレイヤーが利用可能になるまで待機
    const startUpdateLoop = () => {
      if (playerRef.current) {
        // 初期化時はdurationをリセットしない
        requestAnimationFrame(updateController);
      } else {
        // プレイヤーがまだ利用できない場合は再試行
        setTimeout(startUpdateLoop, 100);
      }
    };

    startUpdateLoop();

    return () => {
      // クリーンアップは updateController 内で処理される
    };
  }, [updateController]);

  // SeekBarの初期化
  useEffect(() => {
    if (seekBarRef.current && currentTimeRef.current > 0) {
      updateSeekBar(currentTimeRef.current);
    }
  }, [updateSeekBar]);

  // durationが変更された時にSeekBarを更新
  useEffect(() => {
    if (seekBarRef.current && duration > 0) {
      // durationが変更された時は時間表示を更新
      updateSeekBarTime(currentTimeRef.current, duration);
    }
  }, [duration, updateSeekBarTime]);

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

  // videoIdの変更を監視して動画を切り替え
  useEffect(() => {
    if (playerRef.current && videoId) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);

  const handleSeek = useCallback(
    (time: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time, true);
        currentTimeRef.current = time; // refも更新
        updateSeekBar(time); // SeekBarを直接更新
      }
    },
    [updateSeekBar]
  );

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
        <SeekBar ref={seekBarRef} currentTime={0} duration={duration} onSeek={handleSeek} />
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
              const newTime = currentTimeRef.current - 1;
              playerRef.current?.seekTo(newTime, true);
              currentTimeRef.current = newTime;
              updateSeekBar(newTime);
            }}
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => {
              const newTime = currentTimeRef.current + 1;
              playerRef.current?.seekTo(newTime, true);
              currentTimeRef.current = newTime;
              updateSeekBar(newTime);
            }}
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => {
              const newTime = currentTimeRef.current - 0.1;
              playerRef.current?.seekTo(newTime, true);
              currentTimeRef.current = newTime;
              updateSeekBar(newTime);
            }}
          >
            -0.1
          </button>
          <button
            type="button"
            onClick={() => {
              const newTime = currentTimeRef.current + 0.1;
              playerRef.current?.seekTo(newTime, true);
              currentTimeRef.current = newTime;
              updateSeekBar(newTime);
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
