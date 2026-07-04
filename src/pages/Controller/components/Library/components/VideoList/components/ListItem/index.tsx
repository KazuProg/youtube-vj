import { useYouTubeDataContext } from "@/pages/Controller/contexts/YouTubeDataContext";
import type { VideoItem } from "@/pages/Controller/types/videoItem";
import { getVideoItemDisplayText, getYouTubeVideoId } from "@/pages/Controller/utils/videoItem";
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
  const youtubeVideoId = getYouTubeVideoId(videoItem);
  const displayText = getVideoItemDisplayText(videoItem);

  useEffect(() => {
    if (!youtubeVideoId) {
      return;
    }
    if (title === null || title === youtubeVideoId) {
      fetchTitle(youtubeVideoId).then((fetchedTitle) => {
        setTitle(fetchedTitle);
      });
    }
  }, [youtubeVideoId, title, fetchTitle]);

  return (
    <tr
      data-index={index}
      youtube-id={youtubeVideoId ?? undefined}
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
        {youtubeVideoId ? (
          <img src={`https://img.youtube.com/vi/${youtubeVideoId}/default.jpg`} alt={title || ""} />
        ) : null}
      </td>
      <td className={styles.tdTitle}>{title || displayText}</td>
    </tr>
  );
};

export default ListItem;
