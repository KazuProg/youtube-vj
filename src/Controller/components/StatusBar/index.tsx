import type { MIDIScriptManager } from "@/types/global";
import { useEffect, useState } from "react";
import Status from "./components/Status";
import styles from "./index.module.css";

const StatusBar = () => {
  const [projectionWindow, setProjectionWindow] = useState<Window | null>(null);
  const [midi, setMidi] = useState<MIDIScriptManager | null>(null);

  useEffect(() => {
    handleMIDI(true);
  }, []);

  const handleMIDI = (startup = false) => {
    if (startup && localStorage.getItem("midi") === null) {
      return;
    }

    if (!midi) {
      const _midi = new window.MIDIScriptManager("YouTube-VJ", {
        executeScript: true,
      });
      setMidi(_midi);
      _midi
        .requestAccess()
        .then(() => {
          localStorage.setItem("midi", "true");
        })
        .catch(() => {
          setMidi(null);
        });
    } else {
      midi.openCustomScriptEditor();
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
      <Status text="MIDI" status={midi !== null} onClick={() => handleMIDI()} />
      <Status text="Projection" status={projectionWindow !== null} onClick={openProjectionWindow} />
    </div>
  );
};

export default StatusBar;
