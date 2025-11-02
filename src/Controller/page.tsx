import { LOCAL_STORAGE_KEY } from "@/constants";
import { useGlobalAPI } from "@/hooks/useGlobalAPI";
import Deck from "./components/Deck";
import Mixer from "./components/Mixer";
import StatusBar from "./components/StatusBar";
import styles from "./page.module.css";

const ControllerPage = () => {
  // グローバルAPI管理フックを使用
  const { setGlobalPlayer, setGlobalMixer } = useGlobalAPI();

  return (
    <div className={styles.controllerWindow}>
      <div className={styles.controller}>
        <Deck
          className={styles.deck}
          localStorageKey={LOCAL_STORAGE_KEY.leftDeck}
          deckId={0}
          setGlobalPlayer={setGlobalPlayer}
        />
        <Mixer className={styles.mixer} setGlobalMixer={setGlobalMixer} />
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
