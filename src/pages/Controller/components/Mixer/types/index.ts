import type { VideoItem } from "@/pages/Controller/types/videoItem";

export interface MixerAPI {
  setCrossfader: (value: number) => void;
  setPreparedVideo: (video: VideoItem | string) => void;
  getPreparedVideo: () => VideoItem | null;
  setIsAudioOn: (deckId: number, state: boolean) => void;
  setOpacityValue: (deckId: number, value: number) => void;
}
