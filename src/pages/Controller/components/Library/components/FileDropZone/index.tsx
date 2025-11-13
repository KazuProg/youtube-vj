import { useCallback, useState } from "react";
import styles from "./index.module.css";

interface FileDropZoneProps {
  accept?: string;
  onFileLoad: (text: string, filename?: string) => void;
  children: React.ReactNode;
  className?: string;
}

const FileDropZone = ({
  accept = ".txt",
  onFileLoad,
  children,
  className = "",
}: FileDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const acceptedFile = files.find((file) => {
        if (accept.startsWith(".")) {
          return file.name.endsWith(accept);
        }
        return file.type === accept || file.name.endsWith(accept);
      });

      if (!acceptedFile) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          onFileLoad(text, acceptedFile.name);
        }
      };
      reader.onerror = () => {
        console.error("Failed to read file");
      };
      reader.readAsText(acceptedFile);
    },
    [accept, onFileLoad]
  );

  return (
    <div
      className={`${styles.container} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && <div className={styles.overlay}>+</div>}
    </div>
  );
};

export default FileDropZone;
