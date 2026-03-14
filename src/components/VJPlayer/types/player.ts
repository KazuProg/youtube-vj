/** VJPlayer / usePlayerSync / useDeckAPI が参照する唯一のプレイヤー型 */
export interface VJPlayerInterface {
  getCurrentTime: () => number | null;
  getDuration: () => number | null;
  isPlaying: () => boolean;
  setPlaybackRate: (rate: number) => boolean;
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  destroy?: () => void;
}
