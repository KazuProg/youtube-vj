import { useCallback } from "react";

// Cross-Window-Sync用のカスタムイベント名
const XWIN_SYNC_EVENT = "vj-xwin-sync";

// 同期データの型定義
interface VJSyncData {
  videoId: string;
  playbackRate: number;
  currentTime: number;
  lastUpdated: number;
  paused: boolean;
}

// ストレージインターフェース（将来的な拡張のため）
interface StorageAdapter {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

// デフォルトのlocalStorageアダプター
const defaultStorageAdapter: StorageAdapter = {
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  getItem: (key: string) => localStorage.getItem(key),
  removeItem: (key: string) => localStorage.removeItem(key),
};

// Cross-Window-Sync フック
export const useXWinSync = (
  syncKey: string,
  storageAdapter: StorageAdapter = defaultStorageAdapter
) => {
  // ストレージに書き込み + 即座にクロスウィンドウイベント発火
  const writeToStorage = useCallback(
    (data: VJSyncData) => {
      try {
        storageAdapter.setItem(syncKey, JSON.stringify(data));

        // 同一ウィンドウ内の他のコンポーネントに即座に通知
        window.dispatchEvent(
          new CustomEvent(XWIN_SYNC_EVENT, {
            detail: { key: syncKey, data },
          })
        );
      } catch (error) {
        console.error("Error writing to storage:", error);
      }
    },
    [syncKey, storageAdapter]
  );

  // ストレージから読み込み
  const readFromStorage = useCallback((): VJSyncData | null => {
    try {
      const stored = storageAdapter.getItem(syncKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error reading from storage:", error);
      return null;
    }
  }, [syncKey, storageAdapter]);

  // クロスウィンドウ同期イベントリスナーの設定
  const onXWinSync = useCallback(
    (callback: (data: VJSyncData) => void) => {
      // 同一ウィンドウ内の即座同期（カスタムイベント）
      const handleCustomSync = (e: CustomEvent) => {
        if (e.detail.key === syncKey) {
          callback(e.detail.data);
        }
      };

      // 別ウィンドウ間の同期（storageイベント）
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === syncKey && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            callback(data);
          } catch (error) {
            console.error("Error parsing storage event data:", error);
          }
        }
      };

      window.addEventListener(XWIN_SYNC_EVENT, handleCustomSync as EventListener);
      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener(XWIN_SYNC_EVENT, handleCustomSync as EventListener);
        window.removeEventListener("storage", handleStorageChange);
      };
    },
    [syncKey]
  );

  // ストレージをクリア
  const clearStorage = useCallback(() => {
    try {
      storageAdapter.removeItem(syncKey);

      // クリアイベントもクロスウィンドウ通知
      window.dispatchEvent(
        new CustomEvent(XWIN_SYNC_EVENT, {
          detail: { key: syncKey, data: null, cleared: true },
        })
      );
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }, [syncKey, storageAdapter]);

  return {
    writeToStorage,
    readFromStorage,
    onXWinSync,
    clearStorage,
  };
};
