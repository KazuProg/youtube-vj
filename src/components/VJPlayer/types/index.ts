import type { JsonValue } from "@/types";
import type { YTPlayer } from "../components/YouTubePlayer/types";

export interface VJSyncData extends Record<string, JsonValue> {
  videoId: string;
  playbackRate: number;
  currentTime: number;
  baseTime: number;
  paused: boolean;
}

export interface VJPlayerRef {
  getPlayer: () => YTPlayer | null;
  getCurrentTime: () => number | null;
  setSyncData: (syncData: VJSyncData) => void;
}
