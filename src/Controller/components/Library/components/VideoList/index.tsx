import { useControllerAPIContext } from "@/Controller/contexts/ControllerAPIContext";
import { useEffect, useRef } from "react";
import type { VideoItem } from "../../types";
import ListItem from "./components/ListItem";
import styles from "./index.module.css";

interface VideoListProps {
  videos: VideoItem[];
  selectedIndex: number;
  onSelect: (id: string, index: number) => void;
}

const VideoList = ({ videos, selectedIndex, onSelect }: VideoListProps) => {
  const { mixerAPI } = useControllerAPIContext();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mixerAPI?.setPreparedVideoId(videos[selectedIndex].id);
  }, [mixerAPI, videos, selectedIndex]);

  useEffect(() => {
    const selectedItem = containerRef.current?.querySelector<HTMLTableRowElement>(
      `tr[data-index="${selectedIndex}"]`
    );
    if (selectedItem) {
      selectedItem.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedIndex]);

  return (
    <div ref={containerRef} className={styles.videolist}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.thArt}>Art</th>
            <th className={styles.thTitle}>Title</th>
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {videos.map((item: VideoItem, index: number) => (
            <ListItem
              id={item.id}
              key={`${item.id}-${index}`}
              onSelect={onSelect}
              className={selectedIndex === index ? styles.selected : ""}
              index={index}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VideoList;
