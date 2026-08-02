import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";
import { formatTime, toPercentage } from "./utils";

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
  const timeRef = useRef<HTMLSpanElement>(null);
  const currentTimeRef = useRef(displayTime);
  const cursorPositionRef = useRef<number | null>(null);

  // barの幅とindicatorの再生位置は毎フレーム変化するため、
  // Reactの再レンダリングを介さずrefで直接DOM操作する
  useEffect(() => {
    let animationId: number;
    let lastDisplaySecond = Math.floor(currentTimeFunc());
    let lastTimeTextSecond: number | null = null;

    const updateIndicatorAndTime = (effectiveRatio: number, currentDuration: number) => {
      if (indicatorRef.current) {
        indicatorRef.current.style.left = `${effectiveRatio * 100}%`;
      }
      if (timeRef.current) {
        const flooredSecond = Math.floor(effectiveRatio * currentDuration);
        if (flooredSecond !== lastTimeTextSecond) {
          lastTimeTextSecond = flooredSecond;
          timeRef.current.textContent = formatTime(flooredSecond);
        }
      }
    };

    const update = () => {
      const time = currentTimeFunc();
      currentTimeRef.current = time;

      const currentDuration = durationFunc();
      const actualRatio = currentDuration > 0 ? time / currentDuration : 0;
      const effectiveRatio = cursorPositionRef.current ?? actualRatio;

      if (barRef.current) {
        barRef.current.style.width = `${actualRatio * 100}%`;
      }
      updateIndicatorAndTime(effectiveRatio, currentDuration);

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
        <span ref={timeRef} />
        <span>{formatTime(duration)}</span>
      </div>
      <div className={styles.hotcues}>
        {Array.from(hotCues.entries()).map(([cueId, time]) => (
          <span
            key={cueId}
            className={styles.hotcue}
            style={{ left: `${toPercentage(time, duration)}%` }}
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
            style={{ left: `${toPercentage(marker, duration)}%` }}
          >
            |
          </span>
        ))}
      </div>
    </div>
  );
};

export default SeekBar;
