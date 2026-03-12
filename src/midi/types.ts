import type { MIDIElementTypes } from "./constants";

export type MIDIElementType = (typeof MIDIElementTypes)[keyof typeof MIDIElementTypes];

export interface MappingData {
  name?: string;
  script?: {
    name: string;
    code: string;
  };
}

export interface KeymapMapping extends MappingData {
  midi: string;
}

export interface KeymapObject {
  device: {
    name: string;
    manufacturer: string;
  };
  service: string;
  mappings: KeymapMapping[];
}

export type KeymapsData = KeymapObject[];
