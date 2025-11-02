import { LOCAL_STORAGE_KEY } from "@/constants";
import Deck from "./components/Deck";
import Mixer from "./components/Mixer";
import StatusBar from "./components/StatusBar";
import { DeckAPIProvider } from "./contexts/DeckAPIContext";
import styles from "./page.module.css";

const ControllerPage = () => {
  return (
    <DeckAPIProvider>
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
        <StatusBar />
      </div>
    </DeckAPIProvider>
  );
};

export default ControllerPage;
