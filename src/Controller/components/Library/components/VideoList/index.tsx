import { useControllerAPIContext } from "@/Controller/contexts/ControllerAPIContext";
import { useEffect } from "react";
import type { HistoryItem } from "../../types";
import ListItem from "./components/ListItem";
import styles from "./index.module.css";

interface VideoListProps {
  videos: HistoryItem[];
  selectedIndex: number;
}

const VideoList = ({ videos, selectedIndex }: VideoListProps) => {
  const { mixerAPI } = useControllerAPIContext();

  useEffect(() => {
    mixerAPI?.setPreparedVideoId(videos[selectedIndex].id);
  }, [mixerAPI, videos, selectedIndex]);

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
            <ListItem
              id={item.id}
              key={`${item.id}-${index}`}
              onSelect={() => mixerAPI?.setPreparedVideoId(item.id)}
              className={selectedIndex === index ? styles.selected : ""}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VideoList;
