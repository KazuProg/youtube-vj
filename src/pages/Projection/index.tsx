import VJPlayer from "@/components/VJPlayer";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { MixerData } from "@/types";
import { useEffect, useState } from "react";
import styles from "./index.module.css";

const ProjectionPage = () => {
  const { data: mixerData } = useStorageSync<MixerData>(LOCAL_STORAGE_KEY.mixer);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    document.title = "📺 VJ投影画面";
    document.body.style.backgroundColor = "#000";
  }, []);

  if (!initialized) {
    const init = (fullscreen: boolean) => {
      if (fullscreen) {
        document.documentElement.requestFullscreen?.();
      }
      setInitialized(true);
    };

    return (
      <div className={styles.initContainer}>
        <button type="button" className={styles.fulModeButton} onClick={() => init(true)}>
          全画面表示
          <br />
          Fullscreen
        </button>
        <button type="button" className={styles.winModeButton} onClick={() => init(false)}>
          ウィンドウモード
          <br />
          Window Mode
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        opacity: Math.min((1 - (mixerData?.crossfader ?? 0)) * 2, 1),
      }}
    >
      <VJPlayer className={styles.player} syncKey={LOCAL_STORAGE_KEY.leftDeck} />
    </div>
  );
};

export default ProjectionPage;
