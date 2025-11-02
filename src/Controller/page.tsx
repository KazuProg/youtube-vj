import { LOCAL_STORAGE_KEY } from "@/constants";
import Deck from "./components/Deck";
import Mixer from "./components/Mixer";
import StatusBar from "./components/StatusBar";
import styles from "./page.module.css";

const ControllerPage = () => {
  return (
    <div className={styles.controllerWindow}>
      <div className={styles.controller}>
        <Deck
          className={styles.deck}
          localStorageKey={LOCAL_STORAGE_KEY.leftDeck}
          setGlobalPlayer={(player) => {
            window.ch0 = player;
          }}
        />
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
  );
};

export default ControllerPage;
