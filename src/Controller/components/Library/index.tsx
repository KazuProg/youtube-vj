import { useControllerAPIContext } from "@/Controller/contexts/ControllerAPIContext";
import styles from "./Library.module.css";
import VideoList from "./components/VideoList";
import { useLibraryAPI } from "./hooks/useLibraryAPI";

const Library = () => {
  const { setLibraryAPI } = useControllerAPIContext();

  // useLibraryAPIから履歴データを取得（useStorageSyncの重複を避ける）
  const { history } = useLibraryAPI({
    setGlobalLibrary: setLibraryAPI,
  });

  return (
    <div className={styles.library}>
      <div className={styles.playlist}>
        <ul>
          <li className={styles.focused}>History</li>
        </ul>
      </div>
      <VideoList videos={[...history].reverse()} />
    </div>
  );
};

export default Library;
