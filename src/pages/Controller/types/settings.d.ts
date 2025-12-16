import type { JsonValue } from "@/types";

export interface SettingsData extends Record<string, JsonValue> {
  youtubeDataAPIKey: string | null;
}
