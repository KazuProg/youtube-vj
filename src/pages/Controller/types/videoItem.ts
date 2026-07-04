import type { LoadableVideoSource } from "@/components/VJPlayer/types";

export type VideoItem = {
  source: LoadableVideoSource;
  title?: string;
  start?: number;
};
