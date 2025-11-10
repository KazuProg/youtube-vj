import { useCallback, useEffect, useRef } from "react";

interface UseTextFileReaderOptions {
  accept?: string;
  onLoad?: (text: string, filename?: string) => void;
  onError?: (error: Error) => void;
}

/**
 * テキストファイルを読み込むための汎用カスタムフック
 */
export const useTextFileReader = ({
  accept = ".txt",
  onLoad,
  onError,
}: UseTextFileReaderOptions = {}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onLoad, onError]);

  useEffect(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      const filename = file.name;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          onLoadRef.current?.(text, filename);
        }
      };
      reader.onerror = () => {
        onErrorRef.current?.(new Error("Failed to read file"));
      };
      reader.readAsText(file);
      (e.target as HTMLInputElement).value = "";
    };

    fileInputRef.current = input;
    document.body.appendChild(input);

    return () => {
      input.remove();
      if (fileInputRef.current === input) {
        fileInputRef.current = null;
      }
    };
  }, [accept]);

  return {
    openFileDialog: useCallback(() => fileInputRef.current?.click(), []),
  };
};
