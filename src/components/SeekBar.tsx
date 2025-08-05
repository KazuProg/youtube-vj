import { formatTime } from "@/utils/formatTime";
import styles from "./SeekBar.module.css";

interface SeekBarProps {
  currentTime: number;
  duration: number;
}

const SeekBar = ({ currentTime, duration }: SeekBarProps) => {
  const position = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.seekBar}>
      <div className={styles.bar} style={{ width: `${position}%` }} />
      <div className={styles.indicator} style={{ left: `${position}%` }} />
      <div className={styles.time}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default SeekBar;
