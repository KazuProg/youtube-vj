import Fader from "@/components/Fader";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { MixerData } from "@/types";
import { parseYouTubeURL } from "@/utils/YouTube";
import { useEffect, useRef, useState } from "react";
import { useControllerAPIContext } from "../../contexts/ControllerAPIContext";
import { useMixerAPI } from "./hooks/useMixerAPI";
import styles from "./index.module.css";

interface MixerProps {
  className?: string;
}

const Mixer = ({ className }: MixerProps) => {
  const { deckAPIs, setMixerAPI } = useControllerAPIContext();
  const { dataRef: mixerDataRef, setData: setMixerData } = useStorageSync<MixerData>(
    LOCAL_STORAGE_KEY.mixer,
    (data) => _setMixerData(data),
    { defaultValue: { crossfader: 0 } }
  );
  const [mixerData, _setMixerData] = useState<MixerData>(mixerDataRef.current);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const { mixerAPIRef, preparedVideo, monitorCueStates } = useMixerAPI({
    mixerDataRef,
    setMixerData,
    setGlobalMixer: setMixerAPI,
  });

  const handleVideoIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseYouTubeURL(e.target.value);
    if (parsed && inputRef.current) {
      inputRef.current.value = parsed.id;
      mixerAPIRef.current?.setPreparedVideo(parsed);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = preparedVideo?.id ?? "";
    }
  }, [preparedVideo]);

  return (
    <div className={`${styles.mixer} ${className}`}>
      <div className={styles.loadButtons}>
        <button
          className={styles.loadButton}
          type="button"
          disabled={!preparedVideo}
          onClick={() => {
            if (preparedVideo) {
              deckAPIs[0]?.loadVideo(preparedVideo);
            }
          }}
        >
          Load
        </button>
        <button
          className={styles.loadButton}
          type="button"
          disabled={!preparedVideo}
          onClick={() => {
            if (preparedVideo) {
              deckAPIs[1]?.loadVideo(preparedVideo);
            }
          }}
        >
          Load
        </button>
      </div>
      <fieldset className={styles.loadTrack}>
        <legend>Load Track</legend>
        <img
          className={styles.ytThumbnail}
          alt="YouTube Thumbnail"
          src={`https://img.youtube.com/vi/${preparedVideo?.id}/default.jpg`}
        />
        <input
          type="text"
          id="input-videoId"
          placeholder="Enter YouTube ID"
          onChange={handleVideoIdChange}
          onFocus={(e) => e.target.select()}
          ref={inputRef}
        />
      </fieldset>
      <fieldset className={styles.cueButtons}>
        <legend>Monitor</legend>
        <button
          type="button"
          className={`${styles.cueButton} ${monitorCueStates[0] ? styles.active : ""}`}
          onClick={() => {
            deckAPIs[0]?.isMuted() ? deckAPIs[0]?.unMute() : deckAPIs[0]?.mute();
          }}
        >
          CUE
        </button>
        <button
          type="button"
          className={`${styles.cueButton} ${monitorCueStates[1] ? styles.active : ""}`}
          onClick={() => {
            deckAPIs[1]?.isMuted() ? deckAPIs[1]?.unMute() : deckAPIs[1]?.mute();
          }}
        >
          CUE
        </button>
      </fieldset>
      <fieldset className={styles.crossfader}>
        <legend>Crossfader</legend>
        <Fader
          min={0}
          max={1}
          value={mixerData.crossfader ?? 0}
          step={0.01}
          onChange={(value) => {
            setMixerData({ ...mixerData, crossfader: value });
          }}
        />
      </fieldset>
    </div>
  );
};

export default Mixer;
