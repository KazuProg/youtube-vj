import type { DeckAPI } from "@/pages/Controller/components/Deck/types";
import type { LibraryAPI } from "@/pages/Controller/components/Library/types";
import type { MixerAPI } from "@/pages/Controller/components/Mixer/types";

declare global {
  interface Window {
    // VJ Controller reference
    ch: Record<number, DeckAPI | null>;

    // Mixer
    mixer: MixerAPI | null;

    // Library
    library: LibraryAPI | null;
  }
}
