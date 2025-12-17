import type { YTPlayer } from "../components/YouTubePlayer/types";

export type VJSyncData = {
  videoId: string;
  playbackRate: number;
  currentTime: number;
  baseTime: number;
  paused: boolean;
};

export interface VJPlayerRef {
  getPlayer: () => YTPlayer | null;
  getCurrentTime: () => number | null;
  setSyncData: (syncData: VJSyncData) => void;
}
