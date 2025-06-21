import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import YouTubePlayer, { type YouTubePlayerRef, type PlayerStatus } from "./YouTubePlayer";

// YouTubePlayerRefを継承して、VJ用のプレイヤー参照型を定義
export interface YTPlayerForVJRef extends YouTubePlayerRef {}

// localStorage用の同期データ型
interface VJSyncData {
  videoId: string;
  playerState: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  lastUpdated: number;
}

interface YTPlayerForVJProps {
  onStatusChange?: (status: PlayerStatus) => void;
  autoLoop?: boolean; // VJ用: ループ機能のオン/オフ
  syncMode?: "controller" | "projection"; // 同期モード: コントローラー画面か投影画面か
  syncKey?: string; // 同期用のキー（複数のプレイヤーを区別）
}

const YTPlayerForVJ = forwardRef<YTPlayerForVJRef, YTPlayerForVJProps>(
  (
    { onStatusChange, autoLoop = true, syncMode = "controller", syncKey = "vj-player-default" },
    ref
  ) => {
    const youtubePlayerRef = useRef<YouTubePlayerRef>(null);
    const [lastSyncTime, setLastSyncTime] = useState(0);
    const syncIntervalRef = useRef<number | null>(null);
    const storageKey = `vj-sync-${syncKey}`;

    // localStorageに状態を保存
    const saveToStorage = useCallback(
      (status: PlayerStatus, videoId = "42jhMWfKY9Y") => {
        if (syncMode !== "controller") {
          return; // コントローラーモードのみ保存
        }

        const syncData: VJSyncData = {
          videoId,
          playerState: status.playerState,
          playbackRate: status.playbackRate,
          volume: status.volume,
          isMuted: status.isMuted,
          currentTime: status.currentTime,
          duration: status.duration,
          lastUpdated: Date.now(),
        };

        try {
          localStorage.setItem(storageKey, JSON.stringify(syncData));
        } catch (error) {
          console.error("Error saving to localStorage:", error);
        }
      },
      [syncMode, storageKey]
    );

    // localStorageから状態を読み込み
    const loadFromStorage = useCallback((): VJSyncData | null => {
      try {
        const data = localStorage.getItem(storageKey);
        if (data) {
          const syncData: VJSyncData = JSON.parse(data);
          return syncData;
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }
      return null;
    }, [storageKey]);

    // 時間同期の処理
    const syncTime = useCallback((player: YouTubePlayerRef, syncData: VJSyncData) => {
      const timeDiff = Math.abs(player.currentTime - syncData.currentTime);
      if (timeDiff > 1.0) {
        player.seekTo(syncData.currentTime, true);
      }
    }, []);

    // 再生状態同期の処理
    const syncPlayerState = useCallback((player: YouTubePlayerRef, syncData: VJSyncData) => {
      if (player.playerState !== syncData.playerState) {
        if (syncData.playerState === 1) {
          // YT.PlayerState.PLAYING
          player.playVideo();
        } else if (syncData.playerState === 2) {
          // YT.PlayerState.PAUSED
          player.pauseVideo();
        }
      }
    }, []);

    // 音量・ミュート状態同期の処理
    const syncAudio = useCallback((player: YouTubePlayerRef, syncData: VJSyncData) => {
      if (player.isMuted !== syncData.isMuted) {
        if (syncData.isMuted) {
          player.mute();
        } else {
          player.unMute();
        }
      }

      if (!syncData.isMuted && Math.abs(player.volume - syncData.volume) > 1) {
        player.setVolume(syncData.volume);
      }

      // 再生速度の同期
      if (Math.abs(player.playbackRate - syncData.playbackRate) > 0.01) {
        player.setPlaybackRate(syncData.playbackRate);
      }
    }, []);

    // 投影画面での同期処理
    const syncFromStorage = useCallback(() => {
      if (syncMode !== "projection" || !youtubePlayerRef.current) {
        return;
      }

      const syncData = loadFromStorage();
      if (!syncData || syncData.lastUpdated <= lastSyncTime) {
        return;
      }

      try {
        const player = youtubePlayerRef.current;

        // 各同期処理を実行
        syncTime(player, syncData);
        syncPlayerState(player, syncData);
        syncAudio(player, syncData);

        setLastSyncTime(syncData.lastUpdated);
      } catch (error) {
        console.error("Error during sync:", error);
      }
    }, [syncMode, loadFromStorage, lastSyncTime, syncTime, syncPlayerState, syncAudio]);

    // 定期的な同期処理（投影画面用）
    useEffect(() => {
      if (syncMode === "projection") {
        syncIntervalRef.current = setInterval(syncFromStorage, 100); // 100msごとに同期チェック
        return () => {
          if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
          }
        };
      }
    }, [syncMode, syncFromStorage]);

    // storage eventによる即座の同期（別タブ・別ウィンドウ間）
    useEffect(() => {
      if (syncMode === "projection") {
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === storageKey && e.newValue) {
            syncFromStorage();
          }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
      }
    }, [syncMode, storageKey, syncFromStorage]);

    const handleStatusChange = useCallback(
      (status: PlayerStatus) => {
        // VJ用: 動画が終了したら自動ループ（オプション有効時）
        if (autoLoop && status.playerState === 0 && youtubePlayerRef.current) {
          // 0 = YT.PlayerState.ENDED
          try {
            console.log("VJ Player: Video ended, looping...");
            youtubePlayerRef.current.seekTo(0, true);
            youtubePlayerRef.current.playVideo();
          } catch (error) {
            console.error("Error during VJ video loop:", error);
          }
        }

        // 同期データをlocalStorageに保存（コントローラーモードのみ）
        saveToStorage(status);

        // 親コンポーネントに状態変更を通知
        onStatusChange?.(status);
      },
      [autoLoop, onStatusChange, saveToStorage]
    );

    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* 同期モード表示 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            background: syncMode === "controller" ? "rgba(0,255,0,0.8)" : "rgba(255,0,0,0.8)",
            color: "white",
            padding: "2px 8px",
            fontSize: "12px",
            zIndex: 1000,
            borderRadius: "0 0 4px 0",
          }}
        >
          {syncMode === "controller" ? "CONTROLLER" : "PROJECTION"}
        </div>

        {/* 投影画面の場合は同期状態を表示 */}
        {syncMode === "projection" && (
          <div
            style={{
              position: "absolute",
              top: "30px",
              left: "0",
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "4px 8px",
              fontSize: "10px",
              zIndex: 999,
              borderRadius: "0 4px 4px 0",
              maxWidth: "200px",
            }}
          >
            最終同期: {new Date(lastSyncTime).toLocaleTimeString()}
          </div>
        )}

        <YouTubePlayer
          ref={(playerRef) => {
            // forwardRefで受け取ったrefと内部refの両方を設定
            youtubePlayerRef.current = playerRef;
            if (typeof ref === "function") {
              ref(playerRef);
            } else if (ref) {
              ref.current = playerRef;
            }
          }}
          onStatusChange={handleStatusChange}
        />
      </div>
    );
  }
);

YTPlayerForVJ.displayName = "YTPlayerForVJ";

export default YTPlayerForVJ;
