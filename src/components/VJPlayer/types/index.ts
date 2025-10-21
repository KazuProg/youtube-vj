import type { YTPlayer, YTPlayerEvent } from "@/components/YouTubePlayer/types";
import type { JsonValue } from "../hooks/useStorageSync/types";

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

export interface VJPlayerProps {
  className?: string;
  onStateChange?: (state: YTPlayerEvent) => void;
  syncKey?: string;
  videoId?: string;
}
