import type { VJControllerRef } from "@/Controller/components/VJController/types";

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
    ch0: VJControllerRef | null;

    // MIDI Script Manager
    // biome-ignore lint/style/useNamingConvention: MIDI API naming
    MIDIScriptManager: MIDIScriptManagerConstructor;
  }
}
