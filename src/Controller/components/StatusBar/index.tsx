import { useControllerAPIContext } from "@/Controller/contexts/ControllerAPIContext";
import { useEffect, useRef, useState } from "react";
import Status from "./components/Status";
import styles from "./index.module.css";

const StatusBar = () => {
  const [projectionWindow, setProjectionWindow] = useState<Window | null>(null);
  const { midiAPI, setMidiAPI } = useControllerAPIContext();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // React StrictModeによる二重実行を防ぐ
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    handleMIDI(true);
  }, []);

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
    const projectionUrl = `${window.location.origin}${window.location.pathname}?mode=projection`;

    const newWindow = window.open(
      projectionUrl,
      "VJProjection",
      "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes"
    );

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
      <Status text="MIDI" status={midiAPI !== null} onClick={() => handleMIDI()} />
      <Status text="Projection" status={projectionWindow !== null} onClick={openProjectionWindow} />
    </div>
  );
};

export default StatusBar;
