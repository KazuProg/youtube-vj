import Fader from "@/components/Fader";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { isYouTubeVideoInfo, urlParser } from "@/pages/Controller/utils/youtube";
import type { MixerData } from "@/types";
import { useEffect, useRef, useState } from "react";
import { useControllerAPIContext } from "../../contexts/ControllerAPIContext";
import { useMixerAPI } from "./hooks/useMixerAPI";
import styles from "./index.module.css";

interface MixerProps {
  className?: string;
}

const Mixer = ({ className }: MixerProps) => {
  const { deckAPIs, setMixerAPI, libraryAPI } = useControllerAPIContext();
  const {
    dataRef: mixerDataRef,
    setData: setMixerData,
    onChange: onChangeMixerData,
  } = useStorageSync<MixerData>(LOCAL_STORAGE_KEY.mixer, { crossfader: 0 });
  const [mixerData, _setMixerData] = useState<MixerData>(mixerDataRef.current);

  useEffect(() => {
    return onChangeMixerData(_setMixerData);
  }, [onChangeMixerData]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const { mixerAPIRef, preparedVideo, isAudioOn, opacityValues } = useMixerAPI({
    mixerDataRef,
    setMixerData,
    setGlobalMixer: setMixerAPI,
  });

  const handleVideoIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const info = urlParser.parse(e.target.value);
    if (isYouTubeVideoInfo(info) && inputRef.current) {
      inputRef.current.value = info.id;
      mixerAPIRef.current?.setPreparedVideo({ id: info.id, start: info.params?.start });
    }
    if (info && "list" in info) {
      const playlistId = (info as { list: string }).list;
      libraryAPI?.playlists.addFromYouTubePlaylist(playlistId);
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
      <fieldset className={styles.audioButtons}>
        <legend>Audio</legend>
        <button
          type="button"
          className={`${styles.audioButton} ${isAudioOn[0] ? styles.active : ""}`}
          onClick={() => {
            deckAPIs[0]?.isMuted() ? deckAPIs[0]?.unMute() : deckAPIs[0]?.mute();
          }}
        >
          {isAudioOn[0] ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          className={`${styles.audioButton} ${isAudioOn[1] ? styles.active : ""}`}
          onClick={() => {
            deckAPIs[1]?.isMuted() ? deckAPIs[1]?.unMute() : deckAPIs[1]?.mute();
          }}
        >
          {isAudioOn[1] ? "ON" : "OFF"}
        </button>
      </fieldset>
      <fieldset className={styles.opacityFaders}>
        <legend>Opacity</legend>
        <Fader
          vertical={true}
          style={{ height: "120px" }}
          min={0}
          max={1}
          value={opacityValues[0] ?? 1}
          step={0.01}
          onChange={(value) => {
            deckAPIs[0]?.setFilters({ opacity: `${value}` });
          }}
        />
        <Fader
          vertical={true}
          style={{ height: "120px" }}
          min={0}
          max={1}
          value={opacityValues[1] ?? 1}
          step={0.01}
          onChange={(value) => {
            deckAPIs[1]?.setFilters({ opacity: `${value}` });
          }}
        />
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
