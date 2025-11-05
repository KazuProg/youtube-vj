import styles from "./index.module.css";

interface ListItemProps {
  id: string;
  key: string;
  onSelect: (id: string) => void;
  className: string;
}

const ListItem = ({ id, key, onSelect, className }: ListItemProps) => {
  return (
    <tr
      key={key}
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
        <img src={`https://img.youtube.com/vi/${id}/default.jpg`} alt={id} />
      </td>
      <td className={styles.tdTitle}>{id}</td>
    </tr>
  );
};

export default ListItem;
