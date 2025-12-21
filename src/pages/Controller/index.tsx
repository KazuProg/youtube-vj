import { LOCAL_STORAGE_KEY } from "@/constants";
import { useState } from "react";
import Deck from "./components/Deck";
import Library from "./components/Library";
import Mixer from "./components/Mixer";
import Settings from "./components/Settings";
import StatusBar from "./components/StatusBar";
import { ControllerAPIProvider } from "./contexts/ControllerAPIContext";
import styles from "./index.module.css";

import "./index.css";

// レガシーAPI をグローバルに設定（自動実行）
import "./utils/legacyAPI";

const ControllerPage = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <ControllerAPIProvider>
      <div className={styles.controllerWindow}>
        <div className={styles.controller}>
          <Deck className={styles.deck} localStorageKey={LOCAL_STORAGE_KEY.leftDeck} deckId={0} />
          <Mixer className={styles.mixer} />
          <div
            className={styles.deck}
            style={{
              width: "40vw" /* Dummy Deck */,
            }}
          >
            (RightDeck)
          </div>
        </div>
        <Library />
        <StatusBar onOpenSettings={() => setIsSettingsOpen(true)} />
        <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </ControllerAPIProvider>
  );
};

export default ControllerPage;
