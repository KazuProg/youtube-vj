import { useControllerAPIContext } from "@/Controller/contexts/ControllerAPIContext";
import styles from "./Library.module.css";
import { useLibraryAPI } from "./hooks/useLibraryAPI";
import type { HistoryItem } from "./types";

const Library = () => {
  const { setLibraryAPI } = useControllerAPIContext();

  // useLibraryAPIから履歴データを取得（useStorageSyncの重複を避ける）
  const { history } = useLibraryAPI({
    setGlobalLibrary: setLibraryAPI,
  });

  // サムネイル画像をIDから導出する関数
  const getThumbnailUrl = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/default.jpg`;
  };

  return (
    <div className={styles.library}>
      <div className={styles.playlist}>
        <ul>
          <li className={styles.focused}>History</li>
        </ul>
      </div>
      <div className={styles.videolist}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.thArt}>Art</th>
              <th className={styles.thTitle}>Title</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {[...history].reverse().map((item: HistoryItem) => (
              <tr key={item.id} youtube-id={item.id} style={{ cursor: "pointer" }} tabIndex={0}>
                <td className={styles.tdArt}>
                  <img src={getThumbnailUrl(item.id)} alt={item.title} />
                </td>
                <td className={styles.tdTitle}>{item.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Library;
