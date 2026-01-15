import type { YouTubeVideoMetadata } from "@/types";

export interface MixerAPI {
  setCrossfader: (value: number) => void;
  setPreparedVideo: (video: YouTubeVideoMetadata | string) => void;
  getPreparedVideo: () => YouTubeVideoMetadata | null;
  setMonitorCueState: (deckId: number, state: boolean) => void;
  setOpacityValue: (deckId: number, value: number) => void;
}
