import { useYouTubeDataContext } from "@/pages/Controller/components/Library/contexts/YouTubeDataContext";
import type { VideoItem } from "@/pages/Controller/types/videoItem";
import { useEffect, useState } from "react";
import styles from "./index.module.css";

interface ListItemProps {
  videoItem: VideoItem;
  onSelect: (videoItem: VideoItem, index: number) => void;
  className: string;
  index: number;
}

const ListItem = ({ videoItem, onSelect, className, index }: ListItemProps) => {
  const [title, setTitle] = useState<string | null>(videoItem.title ?? null);
  const { fetchTitle } = useYouTubeDataContext();

  useEffect(() => {
    if (title === null || title === videoItem.id) {
      fetchTitle(videoItem.id).then((title) => {
        setTitle(title);
      });
    }
  }, [videoItem.id, title, fetchTitle]);

  return (
    <tr
      data-index={index}
      youtube-id={videoItem.id}
      className={className}
      tabIndex={0}
      onClick={() => onSelect(videoItem, index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(videoItem, index);
        }
      }}
    >
      <td className={styles.tdArt}>
        <img src={`https://img.youtube.com/vi/${videoItem.id}/default.jpg`} alt={title || ""} />
      </td>
      <td className={styles.tdTitle}>{title || videoItem.id}</td>
    </tr>
  );
};

export default ListItem;
