import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { KeymapObject } from "@/pages/MidiScriptEditor/types";
import { MIDIDevice } from "@/pages/MidiScriptEditor/utils/MIDIDevice";
import { useCallback, useEffect, useRef, useState } from "react";

const MIDI_SERVICE_NAME = "YouTube-VJ";

export interface MidiAPI {
  requestAccess: () => Promise<void>;
  openCustomScriptEditor: () => void;
}

export function useMidiController() {
  const [devices, setDevices] = useState<MIDIDevice[]>([]);
  const [midiAPI, setMidiAPI] = useState<MidiAPI | null>(null);
  const [error, setError] = useState<string | null>(null);
  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const initCalledRef = useRef(false);

  const { dataRef: keymapsRef, onChange: onKeymapsChange } = useStorageSync<KeymapObject[]>(
    LOCAL_STORAGE_KEY.midiScripts,
    []
  );

  const saveDevice = useCallback(() => {
    // Controller は keymaps を読み取り専用。永続化は Script Editor のみが行う。
  }, []);

  const loadKeymapForDevice = useCallback(
    (deviceName: string, manufacturer: string): KeymapObject | undefined => {
      const keymaps = (keymapsRef.current ?? []) as KeymapObject[];
      return keymaps.find(
        (k) => k.device.name === deviceName && k.device.manufacturer === manufacturer
      );
    },
    [keymapsRef]
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
          executeScript: true,
          persistOnChange: false,
          data: keymapData ? { mappings: keymapData.mappings } : undefined,
          midiAccess: midiAccessRef.current ?? undefined,
        });
        return [...filtered, device];
      });
    },
    [loadKeymapForDevice, saveDevice]
  );

  // 他ウィンドウ（Editor）で Import 等により keymaps が更新されたとき、既存デバイスに再適用する
  useEffect(() => {
    const unsubscribe = onKeymapsChange((newKeymaps) => {
      if (!newKeymaps || !Array.isArray(newKeymaps)) {
        return;
      }
      setDevices((prev) => {
        return prev.map((device) => {
          const keymap = (newKeymaps as KeymapObject[]).find(
            (k) => k.device.name === device.name && k.device.manufacturer === device.manufacturer
          );
          if (keymap) {
            device.applyMappings(keymap.mappings);
          }
          return device;
        });
      });
    });
    return unsubscribe;
  }, [onKeymapsChange]);

  const requestAccess = useCallback((): Promise<void> => {
    if (!navigator.requestMIDIAccess) {
      return Promise.reject(new Error("Web MIDI API is not supported."));
    }
    if (initCalledRef.current) {
      return Promise.resolve();
    }
    initCalledRef.current = true;
    return navigator
      .requestMIDIAccess()
      .then((access) => {
        midiAccessRef.current = access;
        setError(null);
        for (const input of access.inputs.values()) {
          handleInputChanged(input);
        }
        access.onstatechange = (e) => {
          const port = e.port;
          if (port && port.type === "input") {
            handleInputChanged(port as MIDIInput);
          }
        };
        setMidiAPI({
          requestAccess: () => Promise.resolve(),
          openCustomScriptEditor: () => {
            window.open("/midi-script-editor", "MidiScriptEditor", "width=640,height=720");
          },
        });
      })
      .catch((err) => {
        initCalledRef.current = false;
        setError(err?.message ?? "Failed to request MIDI access.");
        throw err;
      });
  }, [handleInputChanged]);

  const openCustomScriptEditor = useCallback(() => {
    window.open("/midi-script-editor", "MidiScriptEditor", "width=640,height=720");
  }, []);

  return {
    devices,
    midiAPI,
    error,
    requestAccess,
    openCustomScriptEditor,
  };
}
