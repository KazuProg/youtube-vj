import type { MIDIDeviceInterface } from "./MIDIDevice";
import { MIDIElementTypes } from "./constants";
import type { MIDIElementType } from "./types";
import type { KeymapMapping, MappingData } from "./types";

export interface ExecuteScriptArgument {
  status: number;
  data1: number;
  data2: number;
  type: string;
  channel: number;
  value: number;
  output: (arg1: number | [number, number, number], arg2?: string) => void;
}

export class MIDIElement {
  #device: MIDIDeviceInterface;
  #midiType: MIDIElementType;
  #midiChannel: number;
  #midiNumber: number;
  #name: string | null = null;
  #scriptName: string | null = null;
  #scriptCode: string | null = null;
  #saveCallback: () => void;

  constructor(
    device: MIDIDeviceInterface,
    midiType: MIDIElementType,
    midiChannel: number,
    midiNumber: number,
    saveCallback: () => void,
    data: MappingData = {}
  ) {
    this.#device = device;
    this.#midiType = midiType;
    this.#midiChannel = midiChannel;
    this.#midiNumber = midiNumber;
    this.#saveCallback = saveCallback;

    this.#name = this.#normalizeString(data?.name ?? "");
    this.#applyScript(
      this.#normalizeString(data?.script?.code ?? ""),
      this.#normalizeString(data?.script?.name ?? "")
    );
  }

  get device(): MIDIDeviceInterface {
    return this.#device;
  }

  get type(): MIDIElementType {
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
      case MIDIElementTypes.note:
        return this.#getNoteName(this.#midiNumber);
      case MIDIElementTypes.cc:
        return `0x${this.#midiNumber.toString(16).toUpperCase().padStart(2, "0")}`;
      default:
        return "";
    }
  }

  get controlIdentifier(): string {
    const typeStr = this.type === MIDIElementTypes.note ? "Note" : "CC";
    const channelHex = this.channel.toString(16).toUpperCase();
    return `${typeStr}#${channelHex} ${this.defaultName}`;
  }

  get name(): string {
    return this.#name !== null ? this.#name : this.defaultName;
  }

  set name(value: string) {
    this.#name = this.#normalizeString(value);
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
    this.#scriptName = this.#normalizeString(value);
    this.#saveCallback();
  }

  set scriptCode(value: string) {
    this.#applyScript(this.#normalizeString(value));
    this.#saveCallback();
  }

  updateFromMapping(data: MappingData, save = true): void {
    if (data.name !== undefined) {
      this.#name = this.#normalizeString(data.name);
    }

    if (data.script !== undefined) {
      this.#applyScript(
        this.#normalizeString(data.script.code ?? ""),
        this.#normalizeString(data.script.name ?? "")
      );
    }

    if (save) {
      this.#saveCallback();
    }
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

  toJSON(): KeymapMapping {
    return {
      midi: this.midiID,
      name: this.name,
      ...(this.#scriptCode && {
        script: {
          name: this.#scriptName || "No Name",
          code: this.#scriptCode,
        },
      }),
    };
  }

  #normalizeString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  #applyScript(code: string | null, name?: string | null): void {
    if (code === null) {
      this.#scriptName = null;
      this.#scriptCode = null;
    } else {
      this.#scriptCode = code;
      if (name !== undefined) {
        this.#scriptName = name;
      }
    }
  }

  #getNoteName(noteNumber: number): string {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    return `${noteNames[noteIndex]}${octave}`;
  }
}
