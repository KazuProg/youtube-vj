export interface MidiScriptTemplate {
  name: string;
  code: string;
}

export interface MIDIScriptManager {
  openCustomScriptEditor: (template: MidiScriptTemplate[]) => void;
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
