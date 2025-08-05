import { formatTime } from "@/utils/formatTime";
import { useState } from "react";
import styles from "./SeekBar.module.css";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const SeekBar = ({ currentTime, duration, onSeek }: SeekBarProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const position = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { width, left } = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - left) / width;
    setCursorPosition(position);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      onSeek(currentTime + (e.key === "ArrowRight" ? 1 : -1));
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
      aria-valuenow={currentTime}
    >
      <div className={styles.bar} style={{ width: `${position}%` }} />
      <div
        className={styles.indicator}
        style={{ left: `${isHovering ? cursorPosition * 100 : position}%` }}
      />
      <div className={styles.time}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default SeekBar;
