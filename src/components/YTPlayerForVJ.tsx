import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import YouTubePlayer, { type YouTubePlayerRef, type PlayerStatus } from "./YouTubePlayer";

// localStorage用の同期データ型（投影画面用：音量・ミュート除外）
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
  syncKey?: string; // 同期用のキー（複数のプレイヤーを区別）
}

const YTPlayerForVJ = forwardRef<YouTubePlayerRef, YTPlayerForVJProps>(
  ({ style, onStatusChange, autoLoop = true, syncKey = "vj-player-default" }, ref) => {
    const youtubePlayerRef = useRef<YouTubePlayerRef>(null);
    const syncIntervalRef = useRef<number | null>(null);

    // localStorageから状態を読み込み（投影画面専用）
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

    // 再生速度同期の処理（投影画面：音量・ミュートは除外）
    const syncPlaybackRate = useCallback((player: YouTubePlayerRef, syncData: VJSyncData) => {
      // 再生速度の同期のみ
      if (Math.abs(player.playbackRate - syncData.playbackRate) > 0.01) {
        player.setPlaybackRate(syncData.playbackRate);
      }
    }, []);

    // 投影画面での同期処理
    const syncFromStorage = useCallback(() => {
      if (!youtubePlayerRef.current) {
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
        syncPlaybackRate(player, syncData);
      } catch (error) {
        console.error("Error during sync:", error);
      }
    }, [loadFromStorage, syncTime, syncPlayerState, syncPlaybackRate]);

    // 定期的な同期処理（投影画面用）
    useEffect(() => {
      syncIntervalRef.current = setInterval(syncFromStorage, 100); // 100msごとに同期チェック
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }, [syncFromStorage]);

    // storage eventによる即座の同期（別タブ・別ウィンドウ間）
    useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === syncKey && e.newValue) {
          syncFromStorage();
        }
      };

      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }, [syncKey, syncFromStorage]);

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

        // 投影画面：常にミュート状態を維持
        if (!status.isMuted && youtubePlayerRef.current) {
          youtubePlayerRef.current.mute();
        }

        // 親コンポーネントに状態変更を通知
        onStatusChange?.(status);
      },
      [autoLoop, onStatusChange]
    );

    // 投影画面のマウント時に一度だけ初期同期を実行
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        syncFromStorage(); // 3秒遅延でプレイヤーの初期化完了を待つ

        // 投影画面：確実にミュートに設定
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.mute();
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    }, [syncFromStorage]);

    // 投影画面用のref（基本機能のみ）
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

        return baseRef;
      },
      []
    );

    return (
      <YouTubePlayer style={style} ref={youtubePlayerRef} onStatusChange={handleStatusChange} />
    );
  }
);

YTPlayerForVJ.displayName = "YTPlayerForVJ";

export default YTPlayerForVJ;
