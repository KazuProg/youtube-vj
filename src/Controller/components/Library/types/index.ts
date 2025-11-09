import type { JsonValue } from "@/types";

export interface VideoItem extends Record<string, JsonValue> {
  id: string;
  title: string;
}

export interface LibraryAPI {
  history: {
    add: (videoId: string, title: string) => void;
    remove: (index: number) => void;
    clear: () => void;
    get: () => VideoItem[];
  };
  navigation: {
    selectNext: () => void;
    selectPrev: () => void;
    selectFirst: () => void;
    selectLast: () => void;
    selectTo: (index: number) => void;
  };
}
