import styles from "./index.module.css";

type StatusProps = {
  text: string;
  status: boolean;
  onClick: () => void;
};

const Status = ({ text, status, onClick }: StatusProps) => {
  return (
    <button
      type="button"
      className={`${styles.status} ${styles.clickable}`}
      onClick={onClick}
      aria-pressed={status}
      aria-label={status ? `${text}: ON` : `${text}: OFF`}
    >
      <span className={`${styles.indicator} ${status ? styles.active : ""}`} />
      {text}
    </button>
  );
};

export default Status;
