import { useYouTubeDataContext } from "@/Controller/components/Library/contexts/YouTubeDataContext";
import { useEffect, useState } from "react";
import styles from "./index.module.css";

interface ListItemProps {
  id: string;
  onSelect: (id: string) => void;
  className: string;
  index: number;
}

const ListItem = ({ id, onSelect, className, index }: ListItemProps) => {
  const [title, setTitle] = useState<string>(id);
  const { fetchTitle } = useYouTubeDataContext();

  useEffect(() => {
    fetchTitle(id).then((title) => {
      setTitle(title);
    });
  }, [id, fetchTitle]);

  return (
    <tr
      data-index={index}
      youtube-id={id}
      className={className}
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(id);
        }
      }}
    >
      <td className={styles.tdArt}>
        <img src={`https://img.youtube.com/vi/${id}/default.jpg`} alt={title} />
      </td>
      <td className={styles.tdTitle}>{title}</td>
    </tr>
  );
};

export default ListItem;
