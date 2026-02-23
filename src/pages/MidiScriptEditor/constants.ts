export const MIDIMessageTypes = {
  Note: "n",
  ControlChange: "c",
  CC: "c",
  RawNoteOff: 0x80,
  RawNoteOn: 0x90,
  RawControlChange: 0xb0,
} as const;

export const MIDI_SERVICE_NAME = "YouTube-VJ" as const;
