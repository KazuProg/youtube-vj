import VJPlayer from "@/components/VJPlayer";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { MixerData } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./index.module.css";

const ProjectionPage = () => {
  const [ch0Filters, setCh0Filters] = useState<Record<string, string>>({});
  const [ch1Filters, setCh1Filters] = useState<Record<string, string>>({});
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
    document.title = "YouTube-VJ Projection Window";
    document.body.style.backgroundColor = "#000";
  }, []);

  const { ch0Opacity, ch0ZIndex, ch1Opacity, ch1ZIndex } = useMemo(() => {
    const ch0OpacityBase = ch0Filters.opacity
      ? Number(ch0Filters.opacity.replace("%", "")) / 100
      : 1;
    const ch1OpacityBase = ch1Filters.opacity
      ? Number(ch1Filters.opacity.replace("%", "")) / 100
      : 1;

    const ch0Weight = ch0OpacityBase * (1 - crossfader);
    const ch1Weight = ch1OpacityBase * crossfader;

    const ch0IsFront = ch0Weight >= ch1Weight;
    const ch1IsFront = ch0Weight < ch1Weight;

    return {
      ch0Opacity: (ch0IsFront ? 1 - ch1Weight / 2 : 1) * ch0Weight,
      ch0ZIndex: ch0IsFront ? 1 : 0,
      ch1Opacity: (ch1IsFront ? 1 - ch0Weight / 2 : 1) * ch1Weight,
      ch1ZIndex: ch1IsFront ? 1 : 0,
    };
  }, [ch0Filters, ch1Filters, crossfader]);

  const ch0Events = useMemo(
    () => ({
      onFiltersChange: (filters: Record<string, string>) => {
        setCh0Filters(filters);
      },
    }),
    []
  );

  const ch1Events = useMemo(
    () => ({
      onFiltersChange: (filters: Record<string, string>) => {
        setCh1Filters(filters);
      },
    }),
    []
  );

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
          position: "fixed",
          inset: 0,
          opacity: ch0Opacity,
          zIndex: ch0ZIndex,
          filter: Object.entries(ch0Filters)
            .map(([key, value]) => {
              return `${key}(${value})`;
            })
            .join(" "),
        }}
      >
        <VJPlayer
          className={styles.player}
          syncKey={LOCAL_STORAGE_KEY.leftDeck}
          events={ch0Events}
        />
      </div>
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: ch1Opacity,
          zIndex: ch1ZIndex,
          filter: Object.entries(ch1Filters)
            .map(([key, value]) => {
              return `${key}(${value})`;
            })
            .join(" "),
        }}
      >
        <VJPlayer
          className={styles.player}
          syncKey={LOCAL_STORAGE_KEY.rightDeck}
          events={ch1Events}
        />
      </div>
    </>
  );
};

export default ProjectionPage;
