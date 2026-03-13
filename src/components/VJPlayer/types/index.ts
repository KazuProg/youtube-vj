import type { YTPlayer } from "../components/YouTubePlayer/types";

export type VideoSource = { type: "youtube"; videoId: string };

export type VJSyncData = {
  source: VideoSource;
  playbackRate: number;
  currentTime: number;
  baseTime: number;
  paused: boolean;
  loopStart: number | null;
  loopEnd: number | null;
  filters: Record<string, string>;
};

export interface VJPlayerRef {
  getPlayer: () => YTPlayer | null;
  getCurrentTime: () => number | null;
  setSyncData: (syncData: VJSyncData) => void;
}
