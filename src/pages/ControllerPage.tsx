import Status from "@/components/Status";
import YouTubeController from "@/components/VJController";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useState } from "react";
import styles from "./ControllerPage.module.css";

const ControllerPage = () => {
  const [projectionWindow, setProjectionWindow] = useState<Window | null>(null);

  // 別ウィンドウで投影画面を開く
  const openProjectionWindow = () => {
    const projectionUrl = `${window.location.origin}${window.location.pathname}?mode=projection`;

    const newWindow = window.open(
      projectionUrl,
      "VJProjection",
      "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes"
    );

    if (newWindow) {
      setProjectionWindow(newWindow);
      // ウィンドウが閉じられたときの処理
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

  return (
    <div style={{ padding: "20px" }}>
      <YouTubeController localStorageKey={LOCAL_STORAGE_KEY.player} />
      <div className={styles.statusBar}>
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
