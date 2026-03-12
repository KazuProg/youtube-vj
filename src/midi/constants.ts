import type { MIDIElementType } from "./types";

export const MIDIElementTypes = {
  note: "n",
  cc: "c",
  controlChange: "c",
} as const;

export const MIDIStatusBytes = {
  noteOff: 0x80,
  noteOn: 0x90,
  controlChange: 0xb0,
} as const;

export const STATUS_TO_ELEMENT_TYPE: Record<number, MIDIElementType> = {
  [MIDIStatusBytes.noteOff]: MIDIElementTypes.note,
  [MIDIStatusBytes.noteOn]: MIDIElementTypes.note,
  [MIDIStatusBytes.controlChange]: MIDIElementTypes.cc,
};

export const ELEMENT_TYPE_TO_STATUS: Record<MIDIElementType, number> = {
  [MIDIElementTypes.note]: MIDIStatusBytes.noteOn,
  [MIDIElementTypes.cc]: MIDIStatusBytes.controlChange,
};

export const MIDI_SERVICE_NAME = "YouTube-VJ" as const;
