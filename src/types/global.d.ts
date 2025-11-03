import type { DeckAPI } from "@/Controller/components/Deck/types";
import type { LibraryAPI } from "@/Controller/components/Library/types";
import type { MixerAPI } from "@/Controller/components/Mixer/types";

export interface MIDIScriptManager {
  openCustomScriptEditor: () => void;
  requestAccess: () => Promise<void>;
}

export interface MIDIScriptManagerConstructor {
  new (name: string, options: { executeScript: boolean }): MIDIScriptManager;
}

declare global {
  interface Window {
    // VJ Controller reference
    ch: Record<number, DeckAPI | null>;

    // Mixer
    mixer: MixerAPI | null;

    // Library
    library: LibraryAPI | null;

    // MIDI Script Manager
    // biome-ignore lint/style/useNamingConvention: MIDI API naming
    MIDIScriptManager: MIDIScriptManagerConstructor;
  }
}
