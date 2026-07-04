import type { VideoItem } from "@/pages/Controller/types/videoItem";
import { getPreparedVideoUrl, getYouTubeVideoId } from "@/pages/Controller/utils/videoItem";
import styles from "./index.module.css";

interface PreparedVideoThumbnailProps {
  preparedVideo: VideoItem | null;
}

const PreparedVideoThumbnail = ({ preparedVideo }: PreparedVideoThumbnailProps) => {
  const youtubeVideoId = preparedVideo ? getYouTubeVideoId(preparedVideo) : null;
  const videoUrl = getPreparedVideoUrl(preparedVideo);

  if (youtubeVideoId) {
    return (
      <img
        className={styles.thumbnail}
        alt="YouTube Thumbnail"
        src={`https://img.youtube.com/vi/${youtubeVideoId}/default.jpg`}
      />
    );
  }

  if (videoUrl) {
    return (
      <video className={styles.thumbnail} src={videoUrl} muted playsInline preload="metadata" />
    );
  }

  return <div className={styles.thumbnail} />;
};

export default PreparedVideoThumbnail;
