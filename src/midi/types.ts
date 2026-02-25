export interface KeymapMapping {
  midi: string;
  name?: string;
  script?: {
    name: string;
    code: string;
  };
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
