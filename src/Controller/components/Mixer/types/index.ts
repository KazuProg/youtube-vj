export interface MixerAPI {
  setCrossfader: (value: number) => void;
  setPreparedVideoId: (videoId: string) => void;
  getPreparedVideoId: () => string;
}
