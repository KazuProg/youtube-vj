import { useControllerAPIContext } from "@/pages/Controller/contexts/ControllerAPIContext";
import { useCallback, useEffect, useRef, useState } from "react";
import Status from "./components/Status";
import styles from "./index.module.css";
interface StatusBarProps {
  onOpenSettings: () => void;
}

const StatusBar = ({ onOpenSettings }: StatusBarProps) => {
  const [projectionWindow, setProjectionWindow] = useState<Window | null>(null);
  const { midiAPI, midiRequestAccess, midiOpenScriptEditor, settings, setSettings } =
    useControllerAPIContext();
  const isInitializedRef = useRef(false);

  const handleMIDI = useCallback(
    (startup = false) => {
      if (startup && localStorage.getItem("midi") === null) {
        return;
      }

      if (!midiAPI) {
        midiRequestAccess()
          .then(() => {
            localStorage.setItem("midi", "true");
          })
          .catch((error) => {
            console.error("[StatusBar] Failed to request MIDI access:", error);
          });
      } else {
        midiOpenScriptEditor();
      }
    },
    [midiAPI, midiRequestAccess, midiOpenScriptEditor]
  );

  const handleLibrary = useCallback(() => {
    setSettings({
      ...settings,
      openLibrary: !settings.openLibrary,
    });
  }, [settings, setSettings]);

  useEffect(() => {
    // React StrictModeによる二重実行を防ぐ
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    handleMIDI(true);
    openProjectionWindow();
  }, [handleMIDI]);

  const openProjectionWindow = () => {
    const newWindow = window.open("/projection", "VJProjection", "width=640,height=360");

    if (newWindow) {
      setProjectionWindow(newWindow);
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          setProjectionWindow(null);
          clearInterval(checkClosed);
        }
      }, 1000);
    } else {
      alert("ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。");
    }
  };

  return (
    <div className={styles.statusBar}>
      <Status text="Settings" status={null} onClick={onOpenSettings} />
      <Status text="Library" status={settings.openLibrary} onClick={() => handleLibrary()} />
      <Status text="MIDI" status={midiAPI !== null} onClick={() => handleMIDI()} />
      <Status text="Projection" status={projectionWindow !== null} onClick={openProjectionWindow} />
    </div>
  );
};

export default StatusBar;
