import { MIDIElement } from "./MIDIElement";
import { ELEMENT_TYPE_TO_STATUS, MIDIElementTypes, STATUS_TO_ELEMENT_TYPE } from "./constants";
import type { KeymapMapping, MIDIElementType } from "./types";

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
  onMessage?: (device: MIDIDevice, element: MIDIElement, midiData: MidiMessageData) => void;
  initialMappings?: KeymapMapping[];
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

// ElementsMap[type][channel][number] = MIDIElement | undefined
type ElementsMap = Record<string, (MIDIElement | undefined)[][]>;

export class MIDIDevice implements MIDIDeviceInterface {
  #input: MIDIInput;
  #output: MIDIOutput | null = null;
  #serviceName: string;
  #saveCallback: (device: MIDIDevice) => void;
  #options: MIDIDeviceOptions;
  #elements: ElementsMap;

  constructor(
    midiInput: MIDIInput,
    serviceName: string,
    saveCallback: (device: MIDIDevice) => void,
    options: MIDIDeviceOptions = {}
  ) {
    this.#input = midiInput;
    this.#serviceName = serviceName;
    this.#saveCallback = saveCallback;
    this.#options = options;
    this.#elements = {
      [MIDIElementTypes.note]: Array.from({ length: 16 }, () => []),
      [MIDIElementTypes.cc]: Array.from({ length: 16 }, () => []),
    };

    this.applyMappings(this.#options.initialMappings ?? []);

    this.#input.onmidimessage = this.#onMIDIMessage.bind(this);

    if (this.#options.midiAccess) {
      this.#output =
        [...this.#options.midiAccess.outputs.values()].find(
          (o) => o.name === this.name && o.manufacturer === this.manufacturer
        ) ?? null;
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
    const note = this.#elements[MIDIElementTypes.note].flat();
    const cc = this.#elements[MIDIElementTypes.cc].flat();
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

  applyMappings(mappings: KeymapMapping[]): void {
    for (const mapping of mappings) {
      const type = mapping.midi.substring(0, 1) as MIDIElementType;
      const combined = Number.parseInt(mapping.midi.substring(1), 16);
      const channel = combined >> 8;
      const number = combined & 0xff;

      if (!(type in this.#elements)) {
        continue;
      }

      this.#upsertElement(type, channel, number, mapping);
    }
  }

  #upsertElement(
    type: MIDIElementType,
    channel: number,
    number: number,
    mapping?: KeymapMapping
  ): { upserted: boolean; element: MIDIElement } {
    const existing = this.#elements[type][channel][number];
    if (!existing) {
      const element = new MIDIElement(
        this as unknown as MIDIDeviceInterface,
        type,
        channel,
        number,
        () => this.#save(),
        mapping ?? {}
      );
      this.#elements[type][channel][number] = element;
      return { upserted: true, element };
    }

    if (mapping) {
      existing.updateFromMapping(mapping, false);
      return { upserted: true, element: existing };
    }
    return { upserted: false, element: existing };
  }

  #onMIDIMessage(midiMessage: MIDIMessageEvent): void {
    const data = midiMessage.data;
    if (!data || data.length < 3) {
      return;
    }
    const [status, data1, data2] = data;
    const messageType = status & 0xf0;
    const channel = status & 0x0f;

    const type = STATUS_TO_ELEMENT_TYPE[messageType];
    if (type === undefined) {
      return;
    }

    const { upserted, element } = this.#upsertElement(type, channel, data1);
    if (upserted) {
      this.#save();
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

  #getStatusAndData1(elem: MIDIElement): [number, number] {
    const raw = ELEMENT_TYPE_TO_STATUS[elem.type] | elem.channel;
    return [raw, elem.number];
  }

  #createOutputHandler(status: number, data1: number, _data2: number) {
    const resolveTarget = (name: string): [number, number] | null => {
      const elem = this.findElementByName(name) ?? this.findElementByScriptName(name);
      return elem ? this.#getStatusAndData1(elem) : null;
    };

    const resolveArgs = (
      arg1: number | [number, number, number],
      arg2?: string
    ): [number, number, number] | null => {
      if (Array.isArray(arg1) && arg1.length === 3) {
        return arg1 as [number, number, number];
      }
      if (typeof arg1 !== "number") {
        return null;
      }

      if (typeof arg2 === "string") {
        const target = resolveTarget(arg2);
        if (!target) {
          return null;
        }
        return [...target, arg1];
      }
      return [status, data1, arg1];
    };

    return (arg1: number | [number, number, number], arg2?: string) => {
      if (!this.#output) {
        return;
      }
      const msg = resolveArgs(arg1, arg2);
      if (msg) {
        this.#output.send(msg);
      }
    };
  }

  #save(): void {
    this.#saveCallback(this);
  }

  toJSON(): {
    device: { name: string; manufacturer: string };
    service: string;
    mappings: KeymapMapping[];
  } {
    return {
      device: { name: this.name, manufacturer: this.manufacturer },
      service: this.#serviceName,
      mappings: this.elements.map((e) => e.toJSON()),
    };
  }
}
