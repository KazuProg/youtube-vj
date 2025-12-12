import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { SettingsData } from "@/types";
import { useCallback, useEffect, useState } from "react";
import styles from "./index.module.css";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings = ({ isOpen, onClose }: SettingsProps) => {
  const [apiKey, setApiKey] = useState<string>("");

  const onChangeSettings = useCallback((data: unknown) => {
    const settings = data as SettingsData | null;
    setApiKey(settings?.youtubeDataAPIKey || "");
  }, []);

  const { dataRef: settingsRef, setData: setSettings } = useStorageSync(
    LOCAL_STORAGE_KEY.settings,
    onChangeSettings
  ) as {
    dataRef: React.MutableRefObject<SettingsData | null>;
    setData: (data: SettingsData | null) => void;
    clearData: () => void;
  };

  // 設定画面が開かれたときに初期値を設定
  useEffect(() => {
    if (isOpen) {
      const currentSettings = settingsRef.current;
      setApiKey(currentSettings?.youtubeDataAPIKey || "");
    }
  }, [isOpen, settingsRef]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
    }
  };

  const handleSaveSettings = () => {
    const trimmedKey = apiKey.trim();
    const settings: SettingsData = trimmedKey ? { youtubeDataAPIKey: trimmedKey } : {};
    setSettings(settings);
    onClose();
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={styles.overlay}
        onClick={onClose}
        onKeyDown={handleKeyDown}
      />
      <div className={styles.settingsPanel}>
        <div className={styles.header}>
          <h2 className={styles.title}>設定</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.settingItem}>
            <label htmlFor="youtube-api-key" className={styles.label}>
              YouTube Data API キー
            </label>
            <div className={styles.inputGroup}>
              <input
                id="youtube-api-key"
                type="password"
                className={styles.input}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="APIキーを入力してください"
              />
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.saveButton} onClick={handleSaveSettings}>
            保存
          </button>
        </div>
      </div>
    </>
  );
};

export default Settings;
