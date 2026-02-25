export const MIDIMessageTypes = {
  note: "n",
  controlChange: "c",
  cc: "c",
  rawNoteOff: 0x80,
  rawNoteOn: 0x90,
  rawControlChange: 0xb0,
} as const;

export const MIDI_SERVICE_NAME = "YouTube-VJ" as const;
