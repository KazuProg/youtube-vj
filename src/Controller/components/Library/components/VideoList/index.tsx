import { useControllerAPIContext } from "@/Controller/contexts/ControllerAPIContext";
import type { HistoryItem } from "../../types";
import styles from "./index.module.css";

interface VideoListProps {
  videos: HistoryItem[];
}

const VideoList = ({ videos }: VideoListProps) => {
  const { mixerAPI } = useControllerAPIContext();

  return (
    <div className={styles.videolist}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.thArt}>Art</th>
            <th className={styles.thTitle}>Title</th>
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {videos.map((item: HistoryItem, index: number) => (
            <tr
              key={`${item.id}-${index}`}
              youtube-id={item.id}
              style={{ cursor: "pointer" }}
              tabIndex={0}
              onClick={() => mixerAPI?.setPreparedVideoId(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  mixerAPI?.setPreparedVideoId(item.id);
                }
              }}
            >
              <td className={styles.tdArt}>
                <img src={`https://img.youtube.com/vi/${item.id}/default.jpg`} alt={item.title} />
              </td>
              <td className={styles.tdTitle}>{item.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VideoList;
