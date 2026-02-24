import { useFileIO } from "@/hooks/useFileIO";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScriptEditorModal } from "./components/ScriptEditorModal";
import { MIDI_SERVICE_NAME } from "./constants";
import { useMidiDevices } from "./hooks/useMidiDevices";
import styles from "./index.module.css";
import type { KeymapObject } from "./types";
import type { MIDIElement } from "./utils/MIDIElement";
import { isValidKeymapObject } from "./utils/isValidKeymapObject";

const MidiScriptEditorPage = () => {
  const {
    currentDevice,
    latestElement,
    highlightCallbackRef,
    controlValueCallbackRef,
    error,
    requestAccess,
    importKeymapObject,
  } = useMidiDevices();

  const [editingElement, setEditingElement] = useState<MIDIElement | null>(null);

  const { exportFile, importFile } = useFileIO<KeymapObject>({
    accept: ".json",
    parse: (text) => JSON.parse(text) as KeymapObject,
    onError: (err) => {
      alert(`Import failed: ${err.message}`);
    },
  });

  const keymapListRef = useRef<HTMLTableSectionElement>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 元実装と同様のハイライト処理。setTimeout(0) で React のレンダリング後に実行し、新規要素の行が DOM に存在するようにする
  const highlightElement = useCallback((element: MIDIElement) => {
    const midiID = element.midiID;
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    setTimeout(() => {
      const row = keymapListRef.current?.querySelector(`tr[data-midi-id="${midiID}"]`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        row.classList.remove(styles.highlight);
        void (row as HTMLElement).offsetHeight; // reflow でアニメーションをリセット
        row.classList.add(styles.highlight);
        highlightTimerRef.current = setTimeout(() => {
          row.classList.remove(styles.highlight);
          highlightTimerRef.current = null;
        }, 1000);
      }
    }, 0);
  }, []);

  useEffect(() => {
    document.title = "YouTube-VJ Midi Script Editor";
  }, []);

  useEffect(() => {
    highlightCallbackRef.current = highlightElement;
    return () => {
      highlightCallbackRef.current = null;
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, [highlightCallbackRef, highlightElement]);

  useEffect(() => {
    if (error && window.opener) {
      alert(error);
      window.close();
    }
  }, [error]);

  const handleExport = useCallback(() => {
    if (!currentDevice) {
      return;
    }
    const json = currentDevice.toJSON();
    const filename = `${currentDevice.serviceName}_${currentDevice.manufacturer} ${currentDevice.name}.json`;
    exportFile(json, filename);
  }, [currentDevice, exportFile]);

  const handleImport = useCallback(async () => {
    const data = await importFile();
    if (!data) {
      return;
    }
    if (!isValidKeymapObject(data)) {
      alert("Invalid keymap format.");
      return;
    }
    const ok = importKeymapObject(data, true);
    if (!ok) {
      alert("Import failed. The keymap may have an invalid format or service name.");
    }
  }, [importFile, importKeymapObject]);

  const handleRowClick = useCallback(
    (element: { midiID: string }) => {
      if (!currentDevice) {
        return;
      }
      const el = currentDevice.findElementById(element.midiID);
      if (el) {
        setEditingElement(el);
      }
    },
    [currentDevice]
  );

  const handleEditorClose = useCallback(() => {
    setEditingElement(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2" && !editingElement && latestElement && currentDevice) {
        const el = currentDevice.findElementById(latestElement.midiID);
        if (el) {
          setEditingElement(el);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingElement, latestElement, currentDevice]);

  if (error) {
    return (
      <div className={styles.root}>
        <div className={styles.errorState}>
          <div className={styles.error}>{error}</div>
          <p className={styles.connectHint}>
            popup ではユーザー操作が必要です。下のボタンをクリックして再接続してください。
          </p>
          <button
            type="button"
            className={styles.connectButton}
            onClick={() => requestAccess().catch(() => {})}
          >
            Connect MIDI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h2>Mapping Editor for {MIDI_SERVICE_NAME}</h2>
        <div className={styles.headerDeviceRow}>
          <span>
            {currentDevice
              ? `${currentDevice.manufacturer} ${currentDevice.name}`
              : "No device connected"}
          </span>
        </div>
      </header>

      <div className={styles.keymapTable}>
        <table>
          <thead>
            <tr>
              <th>Control</th>
              <th>Name</th>
              <th>Script</th>
            </tr>
          </thead>
          <tbody ref={keymapListRef}>
            {currentDevice?.elements.map((element) => (
              <tr
                key={`${element.midiID}-${element.scriptCode ?? ""}`}
                data-midi-id={element.midiID}
                onClick={() => handleRowClick(element)}
              >
                <td>{element.controlIdentifier}</td>
                <td>{element.name}</td>
                <td>{element.scriptName ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.buttons}>
        <button type="button" onClick={handleExport} disabled={!currentDevice}>
          Export
        </button>
        <button type="button" onClick={handleImport}>
          Import
        </button>
      </div>

      {editingElement && (
        <ScriptEditorModal
          element={editingElement}
          controlValueCallbackRef={controlValueCallbackRef}
          onClose={handleEditorClose}
        />
      )}
    </div>
  );
};

export default MidiScriptEditorPage;
