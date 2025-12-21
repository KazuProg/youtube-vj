import VJPlayer from "@/components/VJPlayer";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { MixerData } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
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

  const { ch0Opacity, ch0ZIndex, ch1Opacity, ch1ZIndex } = useMemo(() => {
    const ch0OpacityBase = 1; // ch0_opacity
    const ch1OpacityBase = 1; // ch1_opacity

    const cfWeight = 1 - Math.abs((crossfader - 0.5) * 2);
    const ch0Weight = ch0OpacityBase * (0.5 < crossfader ? cfWeight : 1);
    const ch1Weight = ch1OpacityBase * (crossfader < 0.5 ? cfWeight : 1);
    console.log(ch0Weight, ch1Weight);

    const ch0IsFront = ch0Weight >= ch1Weight;
    const ch1IsFront = ch0Weight < ch1Weight;

    const ch0ZIndexValue = ch0IsFront ? 1 : 0;
    const ch1ZIndexValue = ch1IsFront ? 1 : 0;

    const ch0OpacityValue = (ch0IsFront ? 1 - ch1Weight / 2 : 1) * ch0Weight;
    const ch1OpacityValue = (ch1IsFront ? 1 - ch0Weight / 2 : 1) * ch1Weight;

    return {
      ch0Opacity: ch0OpacityValue,
      ch0ZIndex: ch0ZIndexValue,
      ch1Opacity: ch1OpacityValue,
      ch1ZIndex: ch1ZIndexValue,
    };
  }, [crossfader]);

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
    <>
      <div
        style={{
          position: "relative",
          opacity: ch0Opacity,
          zIndex: ch0ZIndex,
        }}
      >
        <VJPlayer className={styles.player} syncKey={LOCAL_STORAGE_KEY.leftDeck} />
      </div>
      <div
        style={{
          position: "relative",
          opacity: ch1Opacity,
          zIndex: ch1ZIndex,
        }}
      >
        <VJPlayer className={styles.player} syncKey={LOCAL_STORAGE_KEY.rightDeck} />
      </div>
    </>
  );
};

export default ProjectionPage;
