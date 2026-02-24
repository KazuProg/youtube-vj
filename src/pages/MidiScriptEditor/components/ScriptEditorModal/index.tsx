import midiScriptTemplate from "@/pages/Controller/utils/midi-script-template";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MIDIElement } from "../../utils/MIDIElement";
import styles from "./index.module.css";

const DEFAULT_PLACEHOLDER = "Enter script here...";

interface ScriptEditorModalProps {
  element: MIDIElement;
  controlValueCallbackRef: React.MutableRefObject<
    ((element: MIDIElement, value: number) => void) | null
  >;
  onClose: () => void;
}

export function ScriptEditorModal({
  element,
  controlValueCallbackRef,
  onClose,
}: ScriptEditorModalProps) {
  const [controlName, setControlName] = useState("");
  const [scriptName, setScriptName] = useState("");
  const [scriptCode, setScriptCode] = useState("");
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);
  const [isChanged, setIsChanged] = useState(false);
  const controlValueSpanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (controlValueSpanRef.current) {
      controlValueSpanRef.current.textContent = "";
    }
    controlValueCallbackRef.current = (targetElement, value) => {
      if (targetElement.midiID === element.midiID && controlValueSpanRef.current) {
        controlValueSpanRef.current.textContent = String(value);
      }
    };
    return () => {
      controlValueCallbackRef.current = null;
    };
  }, [element, controlValueCallbackRef]);

  useEffect(() => {
    if (element) {
      setControlName(element.name);
      setScriptName(element.scriptName ?? "");
      setScriptCode(element.scriptCode ?? "");
      setPlaceholder(DEFAULT_PLACEHOLDER);
      setIsChanged(false);
    }
  }, [element]);

  useEffect(() => {
    const template = midiScriptTemplate.find((t) => t.name === scriptName);
    setPlaceholder(template ? template.code : DEFAULT_PLACEHOLDER);
  }, [scriptName]);

  const handleOverlayClick = useCallback(() => {
    if (isChanged && !window.confirm("変更を保存せずに閉じますか？")) {
      return;
    }
    onClose();
  }, [isChanged, onClose]);

  const handleSave = useCallback(() => {
    const code =
      scriptCode.trim() === "" && placeholder !== DEFAULT_PLACEHOLDER ? placeholder : scriptCode;
    element.name = controlName.trim() || element.defaultName;
    element.scriptName = scriptName.trim();
    element.scriptCode = code;
    onClose();
  }, [controlName, scriptName, scriptCode, placeholder, element, onClose]);

  const handleDiscard = useCallback(() => {
    if (isChanged && !window.confirm("変更を保存せずに閉じますか？")) {
      return;
    }
    onClose();
  }, [isChanged, onClose]);

  const handleDelete = useCallback(() => {
    if (!window.confirm("スクリプトを削除しますか？")) {
      return;
    }
    setScriptName("");
    setScriptCode("");
    element.name = controlName.trim() || element.defaultName;
    element.scriptCode = "";
    onClose();
  }, [controlName, element, onClose]);

  const handleScriptNameFocus = useCallback(() => {
    if (scriptCode !== "") {
      return;
    }
    const current = scriptName;
    setScriptName("");
    setTimeout(() => setScriptName(current), 10);
  }, [scriptName, scriptCode]);

  const handleScriptCodeFocus = useCallback(() => {
    if (scriptCode === "" && placeholder !== DEFAULT_PLACEHOLDER) {
      setScriptCode(placeholder);
      setIsChanged(true);
    }
  }, [scriptCode, placeholder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleDiscard();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleDiscard]);

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      onKeyDown={() => {}}
      role="presentation"
    >
      <dialog
        open
        className={styles.container}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        aria-label="Script Editor"
      >
        <h2>
          Edit: <span className={styles.controlName}>{element.controlIdentifier}</span>
        </h2>
        <div className={styles.elementDetails}>
          <span>Control Name</span>
          <span>：</span>
          <input
            type="text"
            data-field="name"
            value={controlName}
            onChange={(e) => {
              setControlName(e.target.value);
              setIsChanged(true);
            }}
            placeholder="Button1"
          />
          <span>Value</span>
          <span>：</span>
          <span ref={controlValueSpanRef} className={styles.controlValue} />
          <span>Script Name</span>
          <span>：</span>
          <input
            type="text"
            list="script-template"
            data-field="scriptName"
            value={scriptName}
            onChange={(e) => {
              setScriptName(e.target.value);
              setIsChanged(true);
            }}
            onFocus={handleScriptNameFocus}
            placeholder="Play/Pause"
          />
        </div>
        <datalist id="script-template">
          {midiScriptTemplate.map((t) => (
            <option key={t.name} value={t.name} />
          ))}
        </datalist>
        <textarea
          data-field="script"
          value={scriptCode}
          onChange={(e) => {
            setScriptCode(e.target.value);
            setIsChanged(true);
          }}
          onFocus={handleScriptCodeFocus}
          placeholder={placeholder}
          rows={8}
        />
        <div className={styles.buttons}>
          <button type="button" className={styles.delete} onClick={handleDelete}>
            Delete
          </button>
          <button type="button" onClick={handleDiscard}>
            Discard
          </button>
          <button type="button" onClick={handleSave}>
            Save
          </button>
        </div>
      </dialog>
    </div>
  );
}
