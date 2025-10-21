import type { VJPlayerProps } from "@/components/VJPlayer/types";

export interface VJPlayerForControllerProps extends VJPlayerProps {
  videoId?: string;
  onPlaybackRateChange?: (rate: number) => void;
  onVolumeChange?: (volume: number, isMuted: boolean) => void;
}
