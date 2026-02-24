import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeymapObject } from "../types";
import { MIDIDevice } from "../utils/MIDIDevice";
import type { MIDIElement } from "../utils/MIDIElement";
import { isValidKeymapObject } from "../utils/isValidKeymapObject";

export function useMidiDevices() {
  const [devices, setDevices] = useState<MIDIDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<MIDIDevice | null>(null);
  const [latestElement, setLatestElement] = useState<MIDIElement | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const highlightCallbackRef = useRef<((element: MIDIElement) => void) | null>(null);
  const controlValueCallbackRef = useRef<
    ((element: MIDIElement, value: number) => void) | null
  >(null);

  const { dataRef: keymapsRef, setData: setKeymaps, onChange: onKeymapsChange } = useStorageSync<
    KeymapObject[]
  >(LOCAL_STORAGE_KEY.midiScripts, []);

  const saveDevice = useCallback(
    (device: MIDIDevice) => {
      const keymaps = (keymapsRef.current ?? []) as KeymapObject[];
      const json = device.toJSON();
      const existingKeymap = keymaps.find(
        (k) => k.device.name === json.device.name && k.device.manufacturer === json.device.manufacturer
      );
      const mergedMappings = (() => {
        const existingByMidi = new Map(
          (existingKeymap?.mappings ?? []).map((m) => [m.midi, m])
        );
        for (const ourMapping of json.mappings) {
          const existing = existingByMidi.get(ourMapping.midi);
          if (existing?.script && !ourMapping.script) {
            continue;
          }
          existingByMidi.set(ourMapping.midi, ourMapping);
        }
        return Array.from(existingByMidi.values());
      })();
      const mergedJson = { ...json, mappings: mergedMappings };
      const newKeymaps = existingKeymap
        ? keymaps.map((k) =>
            k.device.name === json.device.name && k.device.manufacturer === json.device.manufacturer
              ? mergedJson
              : k
          )
        : [...keymaps, mergedJson];
      setKeymaps(newKeymaps);
    },
    [keymapsRef, setKeymaps]
  );

  const loadKeymapForDevice = useCallback(
    (deviceName: string, manufacturer: string): KeymapObject | undefined => {
      const keymaps = (keymapsRef.current ?? []) as KeymapObject[];
      return keymaps.find((k) => k.device.name === deviceName && k.device.manufacturer === manufacturer);
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
        const device = new MIDIDevice(midiInput, "YouTube-VJ", saveDevice, {
          executeScript: false,
          onMessage: (device, element, midiData) => {
            setLatestElement(element);
            setCurrentDevice((prev) => (prev?.name === device.name ? device : prev));
            setRefreshTrigger((c) => c + 1);
            // 元実装と同様、同期的にハイライトと Value 更新を実行
            highlightCallbackRef.current?.(element);
            controlValueCallbackRef.current?.(element, midiData.data2);
          },
          data: keymapData ? { mappings: keymapData.mappings } : undefined,
          midiAccess: midiAccessRef.current ?? undefined,
        });
        setCurrentDevice((prev) => (prev === null ? device : prev));
        return [...filtered, device];
      });
    },
    [loadKeymapForDevice, saveDevice]
  );

  // 他ウィンドウ（Controller）で keymaps が更新されたとき、既存デバイスに再適用する
  useEffect(() => {
    const unsubscribe = onKeymapsChange((newKeymaps) => {
      if (!newKeymaps || !Array.isArray(newKeymaps)) return;
      setDevices((prev) => {
        return prev.map((device) => {
          const keymap = (newKeymaps as KeymapObject[]).find(
            (k) =>
              k.device.name === device.name && k.device.manufacturer === device.manufacturer
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

  useEffect(() => {
    setCurrentDevice((curr) => {
      const inList = devices.some((d) => d.name === curr?.name && d.manufacturer === curr?.manufacturer);
      if (!curr || !inList) {
        return devices[0] ?? null;
      }
      return curr;
    });
  }, [devices]);

  const requestAccess = useCallback(() => {
    if (!navigator.requestMIDIAccess) {
      setError("Web MIDI API is not supported in this browser.");
      return Promise.reject(new Error("Web MIDI API is not supported."));
    }
    return navigator
      .requestMIDIAccess()
      .then((access) => {
        midiAccessRef.current = access;
        setError(null);
        access.inputs.forEach((input) => handleInputChanged(input));
        access.onstatechange = (e) => {
          const port = e.port;
          if (port && port.type === "input") {
            handleInputChanged(port as MIDIInput);
          }
        };
      })
      .catch((err) => {
        const msg = err?.message ?? "Failed to request MIDI access.";
        setError(msg);
        throw err;
      });
  }, [handleInputChanged]);

  useEffect(() => {
    requestAccess().catch(() => {});
  }, [requestAccess]);

  const updateKeymapsForDevice = useCallback(
    (device: MIDIDevice) => {
      setCurrentDevice(device);
    },
    []
  );

  const importKeymapObject = useCallback(
    (keymapObj: unknown, force = false): boolean => {
      if (!isValidKeymapObject(keymapObj)) {
        return false;
      }
      const obj = keymapObj as KeymapObject;
      if (!force && obj.service !== "YouTube-VJ") {
        return false;
      }
      const keymaps = (keymapsRef.current ?? []) as KeymapObject[];
      const target = keymaps.find(
        (k) => k.device.name === obj.device.name && k.device.manufacturer === obj.device.manufacturer
      );
      const newKeymaps = target
        ? keymaps.map((k) =>
            k.device.name === obj.device.name && k.device.manufacturer === obj.device.manufacturer ? obj : k
          )
        : [...keymaps, obj];
      setKeymaps(newKeymaps);

      const device = devices.find(
        (d) => d.name === obj.device.name && d.manufacturer === obj.device.manufacturer
      );
      if (device) {
        device.applyMappings(obj.mappings);
        updateKeymapsForDevice(device);
      }
      return true;
    },
    [keymapsRef, setKeymaps, devices, updateKeymapsForDevice]
  );

  return {
    devices,
    currentDevice,
    latestElement,
    refreshTrigger,
    highlightCallbackRef,
    controlValueCallbackRef,
    error,
    requestAccess,
    keymapsRef,
    setKeymaps,
    saveDevice,
    importKeymapObject,
    setCurrentDevice,
    setLatestElement,
  };
}
