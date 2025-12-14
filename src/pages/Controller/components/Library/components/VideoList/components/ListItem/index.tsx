import { useYouTubeDataContext } from "@/pages/Controller/components/Library/contexts/YouTubeDataContext";
import { useEffect, useState } from "react";
import styles from "./index.module.css";

interface ListItemProps {
  id: string;
  title: string | null;
  onSelect: (id: string, index: number) => void;
  className: string;
  index: number;
}

const ListItem = ({ id, title: _title, onSelect, className, index }: ListItemProps) => {
  const [title, setTitle] = useState<string | null>(_title);
  const { fetchTitle } = useYouTubeDataContext();

  useEffect(() => {
    if (title === null || title === id) {
      fetchTitle(id).then((title) => {
        setTitle(title);
      });
    }
  }, [id, title, fetchTitle]);

  return (
    <tr
      data-index={index}
      youtube-id={id}
      className={className}
      tabIndex={0}
      onClick={() => onSelect(id, index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(id, index);
        }
      }}
    >
      <td className={styles.tdArt}>
        <img src={`https://img.youtube.com/vi/${id}/default.jpg`} alt={title || ""} />
      </td>
      <td className={styles.tdTitle}>{title || id}</td>
    </tr>
  );
};

export default ListItem;
