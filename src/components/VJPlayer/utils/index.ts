import type { VJSyncData, VideoSource } from "../types";

/** sync の実効再生位置（秒）。paused / baseTime 未設定時は currentTime を返す */
export const getEffectiveSyncTime = (sync: VJSyncData): number => {
  if (sync.paused || sync.baseTime === 0 || sync.source.type === "none") {
    return sync.currentTime;
  }
  const timeSinceUpdate = (Date.now() - sync.baseTime) / 1000;
  return sync.currentTime + timeSinceUpdate * sync.playbackRate;
};

export interface PlaybackStateEvents {
  onPaused?: () => void;
  onUnpaused?: () => void;
  onEnded?: () => void;
}

export const notifyPlaybackStateEvents = (
  events: PlaybackStateEvents | undefined,
  type: "pause" | "play" | "ended",
  syncPaused: boolean
): void => {
  if (type === "pause" && !syncPaused) {
    events?.onPaused?.();
  } else if (type === "play" && syncPaused) {
    events?.onUnpaused?.();
  } else if (type === "ended") {
    events?.onEnded?.();
  }
};

/** プレイヤーが最後に load したソースの識別子（reload 判定用） */
export const getSourceLoadKey = (source: VideoSource): string | null => {
  if (source.type === "youtube") {
    return `youtube:${source.videoId}`;
  }
  if (source.type === "url") {
    return `url:${source.url}`;
  }
  return null;
};

export const hasSourceChanged = (next: VideoSource, prev: VideoSource): boolean => {
  return getSourceLoadKey(next) !== getSourceLoadKey(prev);
};
