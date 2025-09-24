import { formatTime } from "@/utils/formatTime";
import { forwardRef, useEffect, useState } from "react";
import styles from "./SeekBar.module.css";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const SeekBar = forwardRef<HTMLDivElement, SeekBarProps>(
  ({ currentTime, duration, onSeek }, ref) => {
    const [isHovering, setIsHovering] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [displayTime, setDisplayTime] = useState(currentTime);
    const position = duration > 0 ? (displayTime / duration) * 100 : 0;

    // currentTimeが変更された時にdisplayTimeを更新
    useEffect(() => {
      setDisplayTime(currentTime);
    }, [currentTime]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const { width, left } = e.currentTarget.getBoundingClientRect();
      const position = (e.clientX - left) / width;
      setCursorPosition(position);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        onSeek(displayTime + (e.key === "ArrowRight" ? 1 : -1));
      }
    };

    return (
      <div
        ref={ref}
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
        aria-valuenow={currentTime}
      >
        <div className={styles.bar} data-seek-bar style={{ width: `${position}%` }} />
        <div
          className={styles.indicator}
          data-seek-indicator
          style={{ left: `${isHovering ? cursorPosition * 100 : position}%` }}
        />
        <div className={styles.time} data-seek-time>
          <span>{formatTime(displayTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    );
  }
);

SeekBar.displayName = "SeekBar";

export default SeekBar;
