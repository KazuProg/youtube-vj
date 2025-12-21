import { useControllerAPIContext } from "@/pages/Controller/contexts/ControllerAPIContext";
import { useEffect, useRef, useState } from "react";
import Status from "./components/Status";
import styles from "./index.module.css";

interface StatusBarProps {
  onOpenSettings?: () => void;
}

const StatusBar = ({ onOpenSettings }: StatusBarProps) => {
  const [projectionWindow, setProjectionWindow] = useState<Window | null>(null);
  const { midiAPI, setMidiAPI, settings, setSettings } = useControllerAPIContext();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // React StrictModeによる二重実行を防ぐ
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    handleMIDI(true);
  }, []);

  const handleLibrary = () => {
    setSettings({
      ...settings,
      openLibrary: !settings.openLibrary,
    });
  };

  const handleMIDI = (startup = false) => {
    if (startup && localStorage.getItem("midi") === null) {
      return;
    }

    if (!midiAPI) {
      const _midi = new window.MIDIScriptManager("YouTube-VJ", {
        executeScript: true,
      });
      setMidiAPI(_midi);
      _midi
        .requestAccess()
        .then(() => {
          localStorage.setItem("midi", "true");
        })
        .catch((error) => {
          console.error("[StatusBar] Failed to request MIDI access:", error);
          setMidiAPI(null);
        });
    } else {
      midiAPI.openCustomScriptEditor();
    }
  };

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
      <Status text="Library" status={settings.openLibrary} onClick={() => handleLibrary()} />
      <Status text="MIDI" status={midiAPI !== null} onClick={() => handleMIDI()} />
      <Status text="Projection" status={projectionWindow !== null} onClick={openProjectionWindow} />
      {onOpenSettings && <Status text="Settings" status={false} onClick={onOpenSettings} />}
    </div>
  );
};

export default StatusBar;
