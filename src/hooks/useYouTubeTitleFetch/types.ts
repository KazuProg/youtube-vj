import type { YTPlayer } from "@/components/VJPlayer/components/YouTubePlayer/types";

export interface YouTubeVideoData {
  title: string;
  // biome-ignore lint/style/useNamingConvention: YouTube API property
  video_id: string;
}

export type ExtendedYTPlayer = YTPlayer & {
  getVideoData(): YouTubeVideoData;
};
