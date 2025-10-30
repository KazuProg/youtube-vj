import Fader from "@/components/Fader";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { MixerData } from "@/types";
import { useEffect, useRef, useState } from "react";
import Deck from "./components/Deck";
import StatusBar from "./components/StatusBar";
import styles from "./page.module.css";
import { parseYouTubeURL } from "./utils";

const ControllerPage = () => {
  const [preparedVideoId, setPreparedVideoId] = useState<string>("");
  const { data: mixerData, setData: setMixerData } = useStorageSync<MixerData>(
    LOCAL_STORAGE_KEY.mixer
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    window.mixer = {
      setCrossfader: (value: number) => {
        setMixerData({ ...mixerData, crossfader: value });
      },
    };
  }, [mixerData, setMixerData]);

  const handleVideoIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseYouTubeURL(e.target.value);
    if (parsed && inputRef.current) {
      inputRef.current.value = parsed.id;
      setPreparedVideoId(parsed.id);
    }
  };

  return (
    <div className={styles.controllerWindow}>
      <div className={styles.controller}>
        <Deck
          className={styles.deck}
          localStorageKey={LOCAL_STORAGE_KEY.leftDeck}
          setGlobalPlayer={(player) => {
            window.ch0 = player;
          }}
        />
        <div className={styles.mixer}>
          <div className={styles.loadButtons}>
            <button
              className={styles.loadButton}
              type="button"
              onClick={() => window.ch0?.loadVideoById(preparedVideoId)}
            >
              Load
            </button>
          </div>
          <fieldset className={styles.loadTrack}>
            <legend>Load Track</legend>
            <img
              className={styles.ytThumbnail}
              alt="YouTube Thumbnail"
              src={`https://img.youtube.com/vi/${preparedVideoId}/default.jpg`}
            />
            <input
              type="text"
              id="input-videoId"
              placeholder="Enter YouTube ID"
              onChange={handleVideoIdChange}
              ref={inputRef}
            />
          </fieldset>
          <fieldset>
            <legend>Crossfader</legend>
            <Fader
              min={0}
              max={1}
              value={mixerData?.crossfader ?? 0}
              step={0.01}
              onChange={(value) => {
                setMixerData({ ...mixerData, crossfader: value });
              }}
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
      <StatusBar />
    </div>
  );
};

export default ControllerPage;
