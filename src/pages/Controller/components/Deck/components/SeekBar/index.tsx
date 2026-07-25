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
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [displayTime, setDisplayTime] = useState(currentTimeFunc());
  const duration = durationFunc();

  const barRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef(displayTime);
  const isHoveringRef = useRef(isHovering);

  useEffect(() => {
    isHoveringRef.current = isHovering;
  }, [isHovering]);

  // barの幅とindicatorの再生位置は毎フレーム変化するため、
  // Reactの再レンダリングを介さずrefで直接DOM操作する
  useEffect(() => {
    let animationId: number;
    let lastDisplaySecond = Math.floor(currentTimeFunc());

    const update = () => {
      const time = currentTimeFunc();
      currentTimeRef.current = time;

      const currentDuration = durationFunc();
      const position = currentDuration > 0 ? (time / currentDuration) * 100 : 0;

      if (barRef.current) {
        barRef.current.style.width = `${position}%`;
      }
      if (indicatorRef.current && !isHoveringRef.current) {
        indicatorRef.current.style.left = `${position}%`;
      }

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

  // hover中はカーソル位置、非hover中は再生位置をindicatorに反映する
  useEffect(() => {
    if (!indicatorRef.current || !isHovering) {
      return;
    }
    indicatorRef.current.style.left = `${cursorPosition * 100}%`;
  }, [isHovering, cursorPosition]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { width, left } = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - left) / width;
    setCursorPosition(position);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      onSeek(currentTimeRef.current + (e.key === "ArrowRight" ? 1 : -1));
    }
  };

  return (
    <div
      className={styles.seekBar}
      onMouseEnter={() => setIsHovering(true)}
      onMouseMove={handleMouseMove}
      onClick={() => onSeek(cursorPosition * duration)}
      onMouseLeave={() => setIsHovering(false)}
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
