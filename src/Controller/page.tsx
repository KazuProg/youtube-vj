import { LOCAL_STORAGE_KEY } from "@/constants";
import { useEffect, useRef, useState } from "react";
import StatusBar from "./components/StatusBar";
import VJController from "./components/VJController";
import styles from "./page.module.css";
import { parseYouTubeURL } from "./utils";

const ControllerPage = () => {
  const [preparedVideoId, setPreparedVideoId] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("https://img.youtube.com/vi/");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
      <StatusBar />
    </div>
  );
};

export default ControllerPage;
