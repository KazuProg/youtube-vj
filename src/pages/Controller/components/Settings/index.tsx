import { useControllerAPIContext } from "@/pages/Controller/contexts/ControllerAPIContext";
import { useTitleCacheContext } from "@/pages/Controller/contexts/YouTubeDataContext";
import { useEffect } from "react";
import discordIcon from "./discord-icon.svg";
import styles from "./index.module.css";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings = ({ isOpen, onClose }: SettingsProps) => {
  const { settings, setSettings, historyAPI } = useControllerAPIContext();
  const { titleCacheCount, refreshTitleCacheCount, clearTitleCache } = useTitleCacheContext();

  useEffect(() => {
    if (isOpen) {
      refreshTitleCacheCount();
    }
  }, [isOpen, refreshTitleCacheCount]);

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

  const handleChangePreservePauseState = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      preservePauseState: e.target.checked,
    });
  };

  const handleChangeShowYoutubeButton = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      showYoutubeButton: e.target.checked,
    });
  };

  const handleChangeYoutubeDataAPIKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      youtubeDataAPIKey: e.target.value.trim() || null,
    });
  };

  const handleClearHistory = () => {
    if (!window.confirm("再生履歴を削除しますか？")) {
      return;
    }
    historyAPI.clear();
  };

  const handleClearTitleCache = async () => {
    if (!window.confirm("動画タイトルキャッシュを削除しますか？")) {
      return;
    }
    await clearTitleCache();
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
            <label htmlFor="preserve-pause-state" className={styles.label}>
              <input
                id="preserve-pause-state"
                type="checkbox"
                checked={settings.preservePauseState}
                onChange={handleChangePreservePauseState}
              />
              動画Load時に再生状態を保持する
            </label>
          </div>
          <div className={styles.settingItem}>
            <label htmlFor="show-youtube-button" className={styles.label}>
              <input
                id="show-youtube-button"
                type="checkbox"
                checked={settings.showYoutubeButton}
                onChange={handleChangeShowYoutubeButton}
              />
              YouTubeボタンを表示する
            </label>
          </div>
          <div className={styles.settingItem}>
            <label htmlFor="youtube-api-key" className={styles.label}>
              YouTube Data API キー
            </label>
            <div className={styles.inputGroup}>
              <input
                id="youtube-api-key"
                type="password"
                className={styles.input}
                value={settings.youtubeDataAPIKey ?? ""}
                onChange={handleChangeYoutubeDataAPIKey}
                placeholder="APIキーを入力してください"
              />
            </div>
          </div>
          <div className={styles.settingItem}>
            <span className={styles.label}>データのクリア</span>
            <div className={styles.clearRow}>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.dangerButton}`}
                onClick={handleClearHistory}
                title="再生履歴をクリアします"
              >
                履歴をクリア（{historyAPI.history.length}件）
              </button>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.dangerButton}`}
                onClick={handleClearTitleCache}
                title="動画タイトルキャッシュをクリアします"
              >
                キャッシュをクリア（{titleCacheCount ?? "-"}件）
              </button>
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <a
            href="/docs/chrome-extension.html"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.extensionLink}
          >
            Chrome拡張機能ガイド
          </a>
          <a
            href="https://discord.gg/6wNns5NXrs"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.discordLink}
          >
            <img src={discordIcon} className={styles.discordIcon} alt="" />
            Discordコミュニティに参加する
          </a>
        </div>
      </div>
    </>
  );
};

export default Settings;
