import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import YouTubePlayer, { type YouTubePlayerRef, type PlayerStatus } from "./YouTubePlayer";

// localStorage用の同期データ型
interface VJSyncData {
  videoId: string;
  playbackRate: number;
  currentTime: number;
  lastUpdated: number;
  paused: boolean;
}

interface YTPlayerForVJProps {
  style?: React.CSSProperties;
  onStatusChange?: (status: PlayerStatus) => void;
  autoLoop?: boolean; // VJ用: ループ機能のオン/オフ
  syncMode?: "controller" | "projection"; // 同期モード: コントローラー画面か投影画面か
  syncKey?: string; // 同期用のキー（複数のプレイヤーを区別）
}

const YTPlayerForVJ = forwardRef<YouTubePlayerRef, YTPlayerForVJProps>(
  (
    {
      style,
      onStatusChange,
      autoLoop = true,
      syncMode = "controller",
      syncKey = "vj-player-default",
    },
    ref
  ) => {
    const youtubePlayerRef = useRef<YouTubePlayerRef>(null);
    const syncIntervalRef = useRef<number | null>(null);

    // 前回の状態を記録（変更検知用）
    const previousStatus = useRef<PlayerStatus | null>(null);
    const lastSeekTime = useRef<number>(0);

    // 重要な状態変更のみをlocalStorageに保存（最適化版）
    const saveToStorage = useCallback(
      (status: PlayerStatus, videoId = "42jhMWfKY9Y", forceSync = false) => {
        if (syncMode !== "controller") {
          return; // コントローラーモードのみ保存
        }

        const prev = previousStatus.current;

        // 重要な変更のみ同期（パフォーマンス最適化）
        const shouldSync =
          forceSync ||
          !prev ||
          prev.playerState !== status.playerState || // 再生状態変更
          Math.abs(prev.playbackRate - status.playbackRate) > 0.01 || // 速度変更
          Math.abs(prev.volume - status.volume) > 1 || // 音量変更
          prev.isMuted !== status.isMuted || // ミュート状態変更
          Math.abs(prev.duration - status.duration) > 1; // 動画変更

        if (!shouldSync) {
          return; // 重要でない変更はスキップ
        }

        const syncData: VJSyncData = {
          videoId,
          playbackRate: status.playbackRate,
          currentTime: status.currentTime,
          lastUpdated: Date.now(),
          paused: status.playerState === 2,
        };

        try {
          localStorage.setItem(syncKey, JSON.stringify(syncData));
        } catch (error) {
          console.error("Error saving to localStorage:", error);
        }
      },
      [syncMode, syncKey]
    );

    // 手動での再生位置変更時の同期（seekTo操作用）
    const saveSeekPosition = useCallback(
      (currentTime: number, videoId = "42jhMWfKY9Y") => {
        if (syncMode !== "controller") {
          return;
        }

        const now = Date.now();
        // 連続したseek操作を制限（100ms以内は無視）
        if (now - lastSeekTime.current < 100) {
          return;
        }
        lastSeekTime.current = now;

        const currentStatus = previousStatus.current;
        if (!currentStatus) {
          return;
        }

        const syncData: VJSyncData = {
          videoId,
          playbackRate: currentStatus.playbackRate,
          currentTime: currentTime, // 手動変更された位置
          lastUpdated: now,
          paused: currentStatus.playerState === 2,
        };

        try {
          localStorage.setItem(syncKey, JSON.stringify(syncData));
        } catch (error) {
          console.error("Error saving seek position:", error);
        }
      },
      [syncMode, syncKey]
    );

    // localStorageから状態を読み込み
    const loadFromStorage = useCallback((): VJSyncData | null => {
      try {
        const data = localStorage.getItem(syncKey);
        if (data) {
          const syncData: VJSyncData = JSON.parse(data);
          return syncData;
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }
      return null;
    }, [syncKey]);

    // 時間同期の処理
    const syncTime = useCallback((player: YouTubePlayerRef, syncData: VJSyncData) => {
      // 時間経過を考慮した現在の再生位置を計算
      const timeSinceUpdate = (Date.now() - syncData.lastUpdated) / 1000; // 秒に変換
      const adjustedCurrentTime = syncData.paused
        ? syncData.currentTime // 一時停止中は時間を進めない
        : syncData.currentTime + timeSinceUpdate * syncData.playbackRate; // 再生中は経過時間を加算

      const timeDiff = Math.abs(player.currentTime - adjustedCurrentTime);
      if (timeDiff > 1.0) {
        player.seekTo(adjustedCurrentTime, true);
      }
    }, []);

    // 再生状態同期の処理
    const syncPlayerState = useCallback((player: YouTubePlayerRef, syncData: VJSyncData) => {
      if (syncData.paused) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }, []);

    // 音量・ミュート状態同期の処理
    const syncAudio = useCallback((player: YouTubePlayerRef, syncData: VJSyncData) => {
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
      if (!syncData) {
        return;
      }

      try {
        const player = youtubePlayerRef.current;

        // プレイヤーが準備完了しているかチェック
        if (player.duration <= 0) {
          return; // プレイヤー未準備の場合はスキップ
        }

        // 各同期処理を実行
        syncTime(player, syncData);
        syncPlayerState(player, syncData);
        syncAudio(player, syncData);
      } catch (error) {
        console.error("Error during sync:", error);
      }
    }, [syncMode, loadFromStorage, syncTime, syncPlayerState, syncAudio]);

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
          if (e.key === syncKey && e.newValue) {
            syncFromStorage();
          }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
      }
    }, [syncMode, syncKey, syncFromStorage]);

    const handleStatusChange = useCallback(
      (status: PlayerStatus) => {
        // VJ用: 動画が終了したら自動ループ（オプション有効時）
        if (autoLoop && status.playerState === 0 && youtubePlayerRef.current) {
          // 0 = YT.PlayerState.ENDED
          try {
            youtubePlayerRef.current.seekTo(0, true);
            youtubePlayerRef.current.playVideo();
          } catch (error) {
            console.error("Error during VJ video loop:", error);
          }
        }

        // 最適化された同期データをlocalStorageに保存（コントローラーモードのみ）
        saveToStorage(status);

        // 前回の状態を更新
        previousStatus.current = status;

        // 親コンポーネントに状態変更を通知
        onStatusChange?.(status);
      },
      [autoLoop, onStatusChange, saveToStorage]
    );

    // 投影画面のマウント時に一度だけ初期同期を実行
    useEffect(() => {
      if (syncMode === "projection") {
        const timeoutId = setTimeout(() => {
          syncFromStorage(); // 強制同期でlastSyncTime制限を無視
        }, 3000); // 3秒遅延でプレイヤーの初期化完了を待つ

        return () => clearTimeout(timeoutId);
      }
    }, [syncMode, syncFromStorage]);

    // VJ用の拡張ref（seek操作時の同期付き）
    useImperativeHandle(
      ref,
      () => {
        const baseRef = youtubePlayerRef.current;
        if (!baseRef) {
          return {
            playVideo: () => {},
            pauseVideo: () => {},
            seekTo: () => {},
            mute: () => {},
            unMute: () => {},
            setVolume: () => {},
            setPlaybackRate: () => {},
            isMuted: false,
            playerState: 0,
            playbackRate: 1,
            volume: 100,
            currentTime: 0,
            duration: 0,
          };
        }

        return {
          ...baseRef,
          // 手動seek操作時は同期位置も更新
          seekTo: (seconds: number, allowSeekAhead: boolean) => {
            baseRef.seekTo(seconds, allowSeekAhead);
            saveSeekPosition(seconds);
          },
        };
      },
      [saveSeekPosition]
    );

    return (
      <YouTubePlayer style={style} ref={youtubePlayerRef} onStatusChange={handleStatusChange} />
    );
  }
);

YTPlayerForVJ.displayName = "YTPlayerForVJ";

export default YTPlayerForVJ;
