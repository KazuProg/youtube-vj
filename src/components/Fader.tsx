import styles from "./Fader.module.css";

interface FaderProps {
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  onChange: (value: number) => void;
}

const Fader = ({ min = 0, max = 100, value = 50, step = 1, onChange }: FaderProps) => {
  return (
    <div className={`${styles.faderContainer}`}>
      <input
        type="range"
        step={step}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
};

export default Fader;
