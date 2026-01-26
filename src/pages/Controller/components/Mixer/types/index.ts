import type { YouTubeVideoMetadata } from "@/types";

export interface MixerAPI {
  setCrossfader: (value: number) => void;
  setPreparedVideo: (video: YouTubeVideoMetadata | string) => void;
  getPreparedVideo: () => YouTubeVideoMetadata | null;
  setIsAudioOn: (deckId: number, state: boolean) => void;
  setOpacityValue: (deckId: number, value: number) => void;
}
