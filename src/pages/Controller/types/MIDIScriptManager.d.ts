export interface MidiScriptTemplate {
  name: string;
  code: string;
}

export interface MIDIScriptManager {
  openCustomScriptEditor: () => void;
  requestAccess: () => Promise<void>;
}
