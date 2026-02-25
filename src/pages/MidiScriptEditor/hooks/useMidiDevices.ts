import { useMidiDevicesBase } from "@/hooks/useMidiDevicesBase";
import type { KeymapObject, MIDIDevice, MIDIElement, MidiMessageData } from "@/midi";
import { isValidKeymapObject } from "@/midi";
import { useCallback, useEffect, useRef, useState } from "react";

export function useMidiDevices() {
  const [currentDevice, setCurrentDevice] = useState<MIDIDevice | null>(null);
  const [latestElement, setLatestElement] = useState<MIDIElement | null>(null);
  const [, setRefreshTrigger] = useState(0);
  const highlightCallbackRef = useRef<((element: MIDIElement) => void) | null>(null);
  const controlValueCallbackRef = useRef<((element: MIDIElement, value: number) => void) | null>(
    null
  );

  const onMessage = useCallback(
    (device: MIDIDevice, element: MIDIElement, midiData: MidiMessageData) => {
      setLatestElement(element);
      setCurrentDevice((prev) => (prev?.name === device.name ? device : prev));
      setRefreshTrigger((c) => c + 1);
      highlightCallbackRef.current?.(element);
      controlValueCallbackRef.current?.(element, midiData.data2);
    },
    []
  );

  const base = useMidiDevicesBase({ executeScript: false, onMessage });

  useEffect(() => {
    setCurrentDevice((curr) => {
      const inList = base.devices.some(
        (d) => d.name === curr?.name && d.manufacturer === curr?.manufacturer
      );
      if (!curr || !inList) {
        return base.devices[0] ?? null;
      }
      return curr;
    });
  }, [base.devices]);

  const importKeymapObject = useCallback(
    (keymapObj: unknown, force = false): boolean => {
      if (!isValidKeymapObject(keymapObj)) {
        return false;
      }
      const obj = keymapObj as KeymapObject;
      if (!force && obj.service !== "YouTube-VJ") {
        return false;
      }
      const keymaps = (base.keymapsRef.current ?? []) as KeymapObject[];
      const target = keymaps.find(
        (k) =>
          k.device.name === obj.device.name && k.device.manufacturer === obj.device.manufacturer
      );
      const newKeymaps = target
        ? keymaps.map((k) =>
            k.device.name === obj.device.name && k.device.manufacturer === obj.device.manufacturer
              ? obj
              : k
          )
        : [...keymaps, obj];
      base.setKeymaps(newKeymaps);
      const device = base.devices.find(
        (d) => d.name === obj.device.name && d.manufacturer === obj.device.manufacturer
      );
      if (device) {
        device.applyMappings(obj.mappings);
        setCurrentDevice(device);
      }
      return true;
    },
    [base.keymapsRef, base.setKeymaps, base.devices]
  );

  return {
    currentDevice,
    latestElement,
    highlightCallbackRef,
    controlValueCallbackRef,
    requestAccess: base.requestAccess,
    importKeymapObject,
  };
}
