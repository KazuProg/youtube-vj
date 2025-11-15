import VJPlayer from "@/components/VJPlayer";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { MixerData } from "@/types";
import { useEffect } from "react";
import styles from "./index.module.css";

const ProjectionPage = () => {
  const { data: mixerData } = useStorageSync<MixerData>(LOCAL_STORAGE_KEY.mixer);
  useEffect(() => {
    document.title = "📺 VJ投影画面";
    document.body.style.backgroundColor = "#000";
  }, []);

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
