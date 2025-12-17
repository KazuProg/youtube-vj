import type { JsonValue } from "./json";
import type { MixerData } from "./mixerData";

export type { JsonValue, MixerData };

export interface YouTubeVideoMetadata {
  id: string;
  start?: number;
}
