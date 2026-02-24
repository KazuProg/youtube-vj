import { MIDIMessageTypes } from "../constants";
import type { MIDIDeviceInterface } from "./MIDIDevice";

export interface MIDIElementData {
  name?: string;
  script?: {
    name: string;
    code: string;
  };
}

export interface ExecuteScriptArgument {
  status: number;
  data1: number;
  data2: number;
  type: string;
  channel: number;
  value: number;
  output: (arg1: number | [number, number, number] | string, arg2?: number) => void;
}

export class MIDIElement {
  #device: MIDIDeviceInterface;
  #midiType: string;
  #midiChannel: number;
  #midiNumber: number;
  #name: string | null = null;
  #scriptName: string | null = null;
  #scriptCode: string | null = null;
  #saveCallback: () => void;

  constructor(
    device: MIDIDeviceInterface,
    midiType: string,
    midiChannel: number,
    midiNumber: number,
    saveCallback: () => void,
    data: MIDIElementData = {}
  ) {
    this.#device = device;
    this.#midiType = midiType;
    this.#midiChannel = midiChannel;
    this.#midiNumber = midiNumber;
    this.#saveCallback = saveCallback;

    this.#name = data?.name ?? null;
    this.#scriptName = data?.script?.name ?? null;
    this.#scriptCode = data?.script?.code ?? null;
  }

  get device(): MIDIDeviceInterface {
    return this.#device;
  }

  get type(): string {
    return this.#midiType;
  }

  get channel(): number {
    return this.#midiChannel;
  }

  get number(): number {
    return this.#midiNumber;
  }

  get defaultName(): string {
    switch (this.type) {
      case MIDIMessageTypes.Note:
        return this.#getNoteName(this.#midiNumber);
      case MIDIMessageTypes.CC:
        return `0x${this.#midiNumber.toString(16).toUpperCase().padStart(2, "0")}`;
      default:
        return "";
    }
  }

  get controlIdentifier(): string {
    const typeStr = this.type === MIDIMessageTypes.Note ? "Note" : "CC";
    const channelHex = this.channel.toString(16).toUpperCase();
    return `${typeStr}#${channelHex} ${this.defaultName}`;
  }

  get name(): string {
    return this.#name !== null ? this.#name : this.defaultName;
  }

  set name(value: string) {
    const trimmed = value.trim();
    this.#name = trimmed === "" ? null : trimmed;
    this.#saveCallback();
  }

  get isDefaultName(): boolean {
    return this.#name === null;
  }

  get scriptName(): string | null {
    if (this.scriptCode) {
      return this.#scriptName || "No Name";
    }
    return null;
  }

  get scriptCode(): string | null {
    return this.#scriptCode;
  }

  set scriptName(value: string) {
    const trimmed = value.trim();
    this.#scriptName = trimmed === "" ? null : trimmed;
    this.#saveCallback();
  }

  set scriptCode(value: string) {
    const trimmed = value.trim();
    if (trimmed === "") {
      this.#scriptName = null;
      this.#scriptCode = null;
    } else {
      this.#scriptCode = trimmed;
    }
    this.#saveCallback();
  }

  executeScript(argumentObject: ExecuteScriptArgument): void {
    if (!this.#scriptCode) {
      return;
    }
    try {
      const keys = Object.keys(argumentObject) as (keyof ExecuteScriptArgument)[];
      const values = keys.map((k) => argumentObject[k]);
      const fn = new Function(...keys, this.#scriptCode);
      fn(...values);
    } catch (error) {
      console.error("An error occurred while executing the custom script:", error);
    }
  }

  get midiID(): string {
    const combined = (this.channel << 8) + this.number;
    return this.type + combined.toString(16).padStart(3, "0");
  }

  toJSON(): { midi: string; name: string; script?: { name: string; code: string } } {
    const result: { midi: string; name: string; script?: { name: string; code: string } } = {
      midi: this.midiID,
      name: this.name,
    };
    if (this.#scriptCode) {
      result.script = {
        name: this.#scriptName || "No Name",
        code: this.#scriptCode,
      };
    }
    return result;
  }

  #getNoteName(noteNumber: number): string {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    return `${noteNames[noteIndex]}${octave}`;
  }
}
