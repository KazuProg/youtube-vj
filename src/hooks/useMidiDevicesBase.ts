import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { MIDIDevice, MIDI_SERVICE_NAME } from "@/midi";
import type { KeymapObject, MIDIElement, MidiMessageData } from "@/midi";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseMidiDevicesBaseOptions {
  executeScript: boolean;
  onMessage?: (device: MIDIDevice, element: MIDIElement, midiData: MidiMessageData) => void;
}

export function useMidiDevicesBase(options: UseMidiDevicesBaseOptions) {
  const { executeScript, onMessage } = options;

  const [devices, setDevices] = useState<MIDIDevice[]>([]);
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  const storage = useStorageSync<KeymapObject[]>(LOCAL_STORAGE_KEY.midiScripts, []);

  const loadKeymapForDevice = useCallback(
    (deviceName: string, manufacturer: string): KeymapObject | undefined => {
      const keymaps = (storage.dataRef.current ?? []) as KeymapObject[];
      return keymaps.find(
        (k) => k.device.name === deviceName && k.device.manufacturer === manufacturer
      );
    },
    [storage.dataRef]
  );

  const saveDevice = useCallback(
    (device: MIDIDevice) => {
      if (executeScript) {
        return;
      }
      const keymaps = (storage.dataRef.current ?? []) as KeymapObject[];
      const json = device.toJSON();
      const existingKeymap = keymaps.find(
        (k) =>
          k.device.name === json.device.name && k.device.manufacturer === json.device.manufacturer
      );
      const mergedMappings = (() => {
        const existingByMidi = new Map((existingKeymap?.mappings ?? []).map((m) => [m.midi, m]));
        for (const ourMapping of json.mappings) {
          const existing = existingByMidi.get(ourMapping.midi);
          if (existing?.script && !ourMapping.script) {
            continue;
          }
          existingByMidi.set(ourMapping.midi, ourMapping);
        }
        return Array.from(existingByMidi.values());
      })();
      const newKeymaps = existingKeymap
        ? keymaps.map((k) =>
            k.device.name === json.device.name && k.device.manufacturer === json.device.manufacturer
              ? { ...json, mappings: mergedMappings }
              : k
          )
        : [...keymaps, { ...json, mappings: mergedMappings }];
      storage.setData(newKeymaps);
    },
    [executeScript, storage.dataRef, storage.setData]
  );

  const handleInputChanged = useCallback(
    (midiInput: MIDIInput) => {
      setDevices((prev) => {
        const filtered = prev.filter(
          (d) => !(d.name === midiInput.name && d.manufacturer === midiInput.manufacturer)
        );
        if (midiInput.state !== "connected") {
          return filtered;
        }
        const keymapData = loadKeymapForDevice(midiInput.name ?? "", midiInput.manufacturer ?? "");
        const device = new MIDIDevice(midiInput, MIDI_SERVICE_NAME, saveDevice, {
          executeScript,
          persistOnChange: true,
          onMessage,
          data: keymapData ? { mappings: keymapData.mappings } : undefined,
          midiAccess: midiAccessRef.current ?? undefined,
        });
        return [...filtered, device];
      });
    },
    [loadKeymapForDevice, saveDevice, executeScript, onMessage]
  );

  useEffect(() => {
    const unsubscribe = storage.onChange((newKeymaps) => {
      if (!newKeymaps || !Array.isArray(newKeymaps)) {
        return;
      }
      setDevices((prev) =>
        prev.map((device) => {
          const keymap = (newKeymaps as KeymapObject[]).find(
            (k) => k.device.name === device.name && k.device.manufacturer === device.manufacturer
          );
          if (keymap) {
            device.applyMappings(keymap.mappings);
          }
          return device;
        })
      );
    });
    return unsubscribe;
  }, [storage.onChange]);

  const requestAccess = useCallback((): Promise<void> => {
    if (!navigator.requestMIDIAccess) {
      return Promise.reject(new Error("Web MIDI API is not supported."));
    }

    return navigator.requestMIDIAccess().then((access) => {
      midiAccessRef.current = access;
      for (const input of access.inputs.values()) {
        handleInputChanged(input);
      }
      access.onstatechange = (e) => {
        const port = e.port;
        if (port?.type === "input") {
          handleInputChanged(port as MIDIInput);
        }
      };
    });
  }, [handleInputChanged]);

  return {
    devices,
    requestAccess,
    keymapsRef: storage.dataRef,
    setKeymaps: storage.setData,
  };
}
