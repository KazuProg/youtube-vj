export interface MIDIScriptManager {
  openCustomScriptEditor: () => void;
  requestAccess: () => Promise<void>;
}

export interface MIDIScriptManagerConstructor {
  new (name: string, options: { executeScript: boolean }): MIDIScriptManager;
}

declare global {
  interface Window {
    // biome-ignore lint/style/useNamingConvention: MIDI API naming
    MIDIScriptManager: MIDIScriptManagerConstructor;
  }
}
