import { useCallback } from "react";

export interface ImportResult<T> {
  data: T;
  filename: string;
}

export interface UseFileIOOptions<T = unknown> {
  /** Export: MIME type (default: application/json) */
  contentType?: string;
  /** Import: accepted file extensions (default: .json) */
  accept?: string;
  /** Import: parse file text to result (default: JSON.parse). Use (t) => t for raw text. */
  parse?: (text: string) => T;
  /** Import: error handler */
  onError?: (error: Error) => void;
}

export function useFileIO<T = unknown>(options: UseFileIOOptions<T> = {}) {
  const {
    contentType = "application/json",
    accept = ".json",
    parse = JSON.parse as (text: string) => T,
    onError,
  } = options;

  const exportFile = useCallback(
    (data: unknown, filename: string) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [contentType]
  );

  const importFile = useCallback(
    (): Promise<ImportResult<T> | null> =>
      new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.style.display = "none";

        const handleChange = async () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }

          try {
            const text = await file.text();
            const data = parse(text);
            resolve({ data, filename: file.name });
          } catch (error) {
            onError?.(error instanceof Error ? error : new Error(String(error)));
            resolve(null);
          } finally {
            input.remove();
          }
        };

        input.addEventListener("change", handleChange, { once: true });
        input.click();
      }),
    [accept, parse, onError]
  );

  return { exportFile, importFile };
}
