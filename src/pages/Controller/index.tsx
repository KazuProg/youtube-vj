import { LOCAL_STORAGE_KEY } from "@/constants";
import { useState } from "react";
import Deck from "./components/Deck";
import Library from "./components/Library";
import Mixer from "./components/Mixer";
import Settings from "./components/Settings";
import StatusBar from "./components/StatusBar";
import { ControllerAPIProvider, useControllerAPIContext } from "./contexts/ControllerAPIContext";
import styles from "./index.module.css";

import "./index.css";

// レガシーAPI をグローバルに設定（自動実行）
import "./utils/legacyAPI";

const ControllerPageContent = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings } = useControllerAPIContext();

  return (
    <div className={styles.controllerWindow}>
      <div className={styles.controller}>
        <Deck className={styles.deck} localStorageKey={LOCAL_STORAGE_KEY.leftDeck} deckId={0} />
        <Mixer className={styles.mixer} />
        <Deck className={styles.deck} localStorageKey={LOCAL_STORAGE_KEY.rightDeck} deckId={1} />
      </div>
      {settings.openLibrary && <Library />}
      <StatusBar onOpenSettings={() => setIsSettingsOpen(true)} />
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

const ControllerPage = () => {
  const [displayTerms, setDisplayTerms] = useState(true);

  const handleTermsAgree = () => {
    setDisplayTerms(false);
  };

  if (displayTerms) {
    return (
      <div className={styles.termsContainer}>
        <div className={styles.termsPopup}>
          <iframe className={styles.termsIframe} title="利用規約" src="/docs/terms.html" />
          <button className={styles.termsAgreeBtn} type="button" onClick={handleTermsAgree}>
            同意する
          </button>
        </div>
      </div>
    );
  }

  return (
    <ControllerAPIProvider>
      <ControllerPageContent />
    </ControllerAPIProvider>
  );
};

export default ControllerPage;
