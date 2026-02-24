import { MIDIMessageTypes } from "../constants";
import type { KeymapMapping } from "../types";
import { MIDIElement } from "./MIDIElement";

export interface MIDIDeviceInterface {
  name: string;
  manufacturer: string;
  serviceName: string;
  elements: MIDIElement[];
  findElementById(id: string): MIDIElement | undefined;
  findElementByName(name: string): MIDIElement | undefined;
  findElementByScriptName(scriptName: string): MIDIElement | undefined;
}

export interface MIDIDeviceOptions {
  executeScript?: boolean;
  /** keymaps へ永続化するか（Controller は false、Script Editor は true） */
  persistOnChange?: boolean;
  onMessage?: (device: MIDIDevice, element: MIDIElement, midiData: MidiMessageData) => void;
  data?: KeymapMapping[] | { mappings: KeymapMapping[] };
  midiAccess?: MIDIAccess;
}

export interface MidiMessageData {
  raw: Uint8Array;
  status: number;
  data1: number;
  data2: number;
  type: string;
  channel: number;
}

type ElementsMap = Record<string, (MIDIElement | undefined)[][]>;

export class MIDIDevice implements MIDIDeviceInterface {
  #input: MIDIInput;
  #output: MIDIOutput | null = null;
  #serviceName: string;
  #saveCallback: (device: MIDIDevice) => void;
  #options: Required<Omit<MIDIDeviceOptions, "data" | "midiAccess">> & {
    data: KeymapMapping[] | { mappings: KeymapMapping[] } | null;
    midiAccess: MIDIAccess | null;
  };
  #elements: ElementsMap;

  constructor(
    midiInput: MIDIInput,
    serviceName: string,
    saveCallback: (device: MIDIDevice) => void,
    options: MIDIDeviceOptions = {}
  ) {
    if (!(midiInput instanceof MIDIInput)) {
      throw new TypeError("Expected a MIDIInput object");
    }
    this.#input = midiInput;
    this.#input.onmidimessage = this.#onMIDIMessage.bind(this);

    this.#serviceName = serviceName;
    this.#saveCallback = saveCallback;

    this.#options = {
      executeScript: false,
      persistOnChange: true,
      onMessage: () => {},
      data: null,
      midiAccess: null,
      ...options,
    };

    this.#elements = {
      [MIDIMessageTypes.Note]: Array.from({ length: 16 }, () => []),
      [MIDIMessageTypes.CC]: Array.from({ length: 16 }, () => []),
    };

    if (this.#options.data) {
      const mappings = Array.isArray(this.#options.data)
        ? this.#options.data
        : this.#options.data.mappings;
      this.applyMappings(mappings);
    }

    if (this.#options.midiAccess) {
      for (const output of this.#options.midiAccess.outputs.values()) {
        if (output.name === this.name && output.manufacturer === this.manufacturer) {
          this.#output = output;
          break;
        }
      }
    }
  }

  get name(): string {
    return this.#input.name ?? "";
  }

  get manufacturer(): string {
    return this.#input.manufacturer ?? "";
  }

  get serviceName(): string {
    return this.#serviceName;
  }

  get elements(): MIDIElement[] {
    const note = this.#elements[MIDIMessageTypes.Note].flat();
    const cc = this.#elements[MIDIMessageTypes.CC].flat();
    return [...note, ...cc].filter((e): e is MIDIElement => e !== undefined);
  }

  findElementById(id: string): MIDIElement | undefined {
    return this.elements.find((elem) => elem.midiID === id);
  }

  findElementByName(name: string): MIDIElement | undefined {
    return this.elements.find((elem) => elem.name === name);
  }

  findElementByScriptName(scriptName: string): MIDIElement | undefined {
    return this.elements.find((elem) => elem.scriptName === scriptName);
  }

  applyMappings(mappings: KeymapMapping[] | null | undefined): void {
    if (!mappings) return;
    for (const mapping of mappings) {
      const type = mapping.midi.substring(0, 1);
      const combined = Number.parseInt(mapping.midi.substring(1), 16);
      const channel = combined >> 8;
      const number = combined & 0xff;

      if (!(type in this.#elements)) {
        continue;
      }

      const element = new MIDIElement(
        this as unknown as MIDIDeviceInterface,
        type,
        channel,
        number,
        () => this.#save(),
        mapping
      );
      this.#elements[type][channel][number] = element;
    }
  }

  #onMIDIMessage(midiMessage: MIDIMessageEvent): void {
    const data = midiMessage.data;
    if (!data || data.length < 3) {
      return;
    }
    const [status, data1, data2] = data;
    const messageType = status & 0xf0;
    const channel = status & 0x0f;

    let type: string;
    switch (messageType) {
      case MIDIMessageTypes.RawNoteOn:
      case MIDIMessageTypes.RawNoteOff:
        type = MIDIMessageTypes.Note;
        break;
      case MIDIMessageTypes.RawControlChange:
        type = MIDIMessageTypes.CC;
        break;
      default:
        return;
    }

    const elements = this.#elements[type];
    if (!elements[channel][data1]) {
      elements[channel][data1] = new MIDIElement(
        this as unknown as MIDIDeviceInterface,
        type,
        channel,
        data1,
        () => this.#save()
      );
      this.#save();
    }

    const element = elements[channel][data1];
    if (!element) {
      return;
    }

    if (this.#options.onMessage && data) {
      this.#options.onMessage(this, element, {
        raw: data,
        status,
        data1,
        data2,
        type,
        channel,
      });
    }

    if (this.#options.executeScript) {
      const output = this.#createOutputHandler(status, data1, data2);
      element.executeScript({
        status,
        data1,
        data2,
        type,
        channel,
        value: data2,
        output,
      });
    }
  }

  #createOutputHandler(status: number, data1: number, _data2: number) {
    return (arg1: number | [number, number, number] | string, arg2?: number) => {
      if (!this.#output) {
        return;
      }
      let _status = status;
      let _data1 = data1;
      let _data2: number | null = null;

      if (typeof arg1 === "number") {
        _data2 = arg1;
      } else if (Array.isArray(arg1) && arg1.length === 3) {
        [_status, _data1, _data2] = arg1;
      } else if (typeof arg1 === "string") {
        const elem = this.findElementByName(arg1) ?? this.findElementByScriptName(arg1);
        if (!elem) {
          return;
        }
        _status =
          (elem.type === MIDIMessageTypes.Note
            ? MIDIMessageTypes.RawNoteOn
            : MIDIMessageTypes.RawControlChange) | elem.channel;
        _data1 = elem.number;
        _data2 = arg2 ?? null;
      }

      if (_data2 !== null) {
        this.#output.send([_status, _data1, _data2]);
      }
    };
  }

  #save(): void {
    if (this.#options.persistOnChange) {
      this.#saveCallback(this);
    }
  }

  toJSON(): {
    device: { name: string; manufacturer: string };
    service: string;
    mappings: KeymapMapping[];
  } {
    return {
      device: { name: this.name, manufacturer: this.manufacturer },
      service: this.#serviceName,
      mappings: this.elements.map((e) => e.toJSON()) as KeymapMapping[],
    };
  }
}
