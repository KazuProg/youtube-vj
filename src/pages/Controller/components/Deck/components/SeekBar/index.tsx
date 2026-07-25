import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";
import { formatTime } from "./utils";

interface SeekBarProps {
  currentTimeFunc: () => number;
  durationFunc: () => number;
  hotCues: Map<number, number>;
  loopMarkers: number[];
  onSeek: (time: number) => void;
}

const SeekBar = ({ currentTimeFunc, durationFunc, hotCues, loopMarkers, onSeek }: SeekBarProps) => {
  const [displayTime, setDisplayTime] = useState(currentTimeFunc());
  const duration = durationFunc();

  const barRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef(displayTime);
  const cursorPositionRef = useRef<number | null>(null);

  // barの幅とindicatorの再生位置は毎フレーム変化するため、
  // Reactの再レンダリングを介さずrefで直接DOM操作する
  useEffect(() => {
    let animationId: number;
    let lastDisplaySecond = Math.floor(currentTimeFunc());

    const updateIndicator = (position: number) => {
      if (!indicatorRef.current) {
        return;
      }
      const indicatorPosition =
        cursorPositionRef.current !== null ? cursorPositionRef.current * 100 : position;
      indicatorRef.current.style.left = `${indicatorPosition}%`;
    };

    const update = () => {
      const time = currentTimeFunc();
      currentTimeRef.current = time;

      const currentDuration = durationFunc();
      const position = currentDuration > 0 ? (time / currentDuration) * 100 : 0;

      if (barRef.current) {
        barRef.current.style.width = `${position}%`;
      }
      updateIndicator(position);

      const currentSecond = Math.floor(time);
      if (currentSecond !== lastDisplaySecond) {
        lastDisplaySecond = currentSecond;
        setDisplayTime(time);
      }

      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [currentTimeFunc, durationFunc]);

  const getPositionFromEvent = (e: React.MouseEvent<HTMLDivElement>): number => {
    const { width, left } = e.currentTarget.getBoundingClientRect();
    return (e.clientX - left) / width;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      onSeek(currentTimeRef.current + (e.key === "ArrowRight" ? 1 : -1));
    }
  };

  return (
    <div
      className={styles.seekBar}
      onMouseMove={(e) => {
        cursorPositionRef.current = getPositionFromEvent(e);
      }}
      onClick={(e) => onSeek(getPositionFromEvent(e) * duration)}
      onMouseLeave={() => {
        cursorPositionRef.current = null;
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={displayTime}
    >
      <div className={styles.bar} data-seek-bar ref={barRef} />
      <div className={styles.indicator} data-seek-indicator ref={indicatorRef} />
      <div className={styles.time} data-seek-time>
        <span>{formatTime(displayTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div className={styles.hotcues}>
        {Array.from(hotCues.entries()).map(([cueId, time]) => (
          <span
            key={cueId}
            className={styles.hotcue}
            style={{ left: `${(time / duration) * 100}%` }}
          >
            {cueId}
          </span>
        ))}
      </div>
      <div className={styles.loop}>
        {loopMarkers.map((marker) => (
          <span
            key={marker}
            className={styles.loopMarker}
            style={{ left: `${(marker / duration) * 100}%` }}
          >
            |
          </span>
        ))}
      </div>
    </div>
  );
};

export default SeekBar;
