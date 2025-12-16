export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface MixerData extends Record<string, JsonValue> {
  crossfader: number;
}

export interface YouTubeVideoMetadata {
  id: string;
  start?: number;
}
