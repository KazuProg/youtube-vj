import VJPlayer from "@/components/VJPlayer";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { MixerData } from "@/types";
import { useCallback, useEffect, useState } from "react";
import styles from "./index.module.css";

const ProjectionPage = () => {
  // crossfaderの値だけを監視して再レンダリング
  const [crossfader, setCrossfader] = useState<number>(0);

  const onChangeMixerData = useCallback((mixerData: MixerData | null) => {
    setCrossfader(mixerData?.crossfader ?? 0);
  }, []);

  const { dataRef: mixerDataRef } = useStorageSync<MixerData>(
    LOCAL_STORAGE_KEY.mixer,
    onChangeMixerData
  );

  // 初期値を設定
  useEffect(() => {
    setCrossfader(mixerDataRef.current?.crossfader ?? 0);
  }, [mixerDataRef]);

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
        opacity: Math.min((1 - crossfader) * 2, 1),
      }}
    >
      <VJPlayer className={styles.player} syncKey={LOCAL_STORAGE_KEY.leftDeck} />
    </div>
  );
};

export default ProjectionPage;
