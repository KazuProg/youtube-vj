import Status from "@/components/Status";
import VJController from "@/components/VJController";
import { LOCAL_STORAGE_KEY } from "@/constants";
import type { MIDIScriptManager } from "@/types/midi-script-manager";
import { parseYouTubeURL } from "@/utils/YouTubeURLParser";
import { useEffect, useRef, useState } from "react";
import styles from "./ControllerPage.module.css";

const ControllerPage = () => {
  const [projectionWindow, setProjectionWindow] = useState<Window | null>(null);
  const [midi, setMidi] = useState<MIDIScriptManager | null>(null);
  const [preparedVideoId, setPreparedVideoId] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("https://img.youtube.com/vi/");
  const [leftDeckVideoId, setLeftDeckVideoId] = useState<string>("BLeUas72Mzk");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
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

  const handleVideoIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseYouTubeURL(e.target.value);
    if (parsed && inputRef.current) {
      inputRef.current.value = parsed.id;
      setPreparedVideoId(parsed.id);
      const thumbnailUrl = `https://img.youtube.com/vi/${parsed.id}/default.jpg`;
      setThumbnailUrl(thumbnailUrl);
    }
  };

  return (
    <div className={styles.controllerWindow}>
      <div className={styles.controller}>
        <VJController
          className={styles.deck}
          localStorageKey={LOCAL_STORAGE_KEY.player}
          videoId={leftDeckVideoId}
          setGlobalPlayer={(player) => {
            window.ch0 = player;
          }}
        />
        <div className={styles.mixer}>
          <div className={styles.loadButtons}>
            <button
              className={styles.loadButton}
              type="button"
              onClick={() => setLeftDeckVideoId(preparedVideoId)}
            >
              Load
            </button>
          </div>
          <fieldset className={styles.loadTrack}>
            <legend>Load Track</legend>
            <img className={styles.ytThumbnail} alt="YouTube Thumbnail" src={thumbnailUrl} />
            <input
              type="text"
              id="input-videoId"
              placeholder="Enter YouTube ID"
              onChange={handleVideoIdChange}
              ref={inputRef}
            />
          </fieldset>
        </div>
        <div
          className={styles.deck}
          style={{
            width: "40vw" /* Dummy Deck */,
          }}
        >
          (RightDeck)
        </div>
      </div>
      <div className={styles.statusBar}>
        <Status text="MIDI" status={midi !== null} onClick={() => handleMIDI()} />
        <Status
          text="Projection"
          status={projectionWindow !== null}
          onClick={openProjectionWindow}
        />
      </div>
    </div>
  );
};

export default ControllerPage;
