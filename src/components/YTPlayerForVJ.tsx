import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { useXWinSync } from "../hooks/useXWinSync";
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
    const lastSyncDataRef = useRef<VJSyncData | null>(null);

    // useXWinSyncフックを使用（投影画面は読み取り専用）
    const { readFromStorage, onXWinSync } = useXWinSync(syncKey);

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

    // 再生速度同期の処理（投影画面専用：音量制御なし）
    const syncPlaybackRate = useCallback((player: YouTubePlayerRef, syncData: VJSyncData) => {
      // 再生速度の同期のみ
      if (Math.abs(player.playbackRate - syncData.playbackRate) > 0.01) {
        player.setPlaybackRate(syncData.playbackRate);
      }
    }, []);

    // 同期処理のメイン関数
    const handleSyncData = useCallback(
      (syncData: VJSyncData) => {
        if (!youtubePlayerRef.current) {
          return;
        }

        // 同じデータなら処理をスキップ（パフォーマンス最適化）
        if (
          lastSyncDataRef.current &&
          lastSyncDataRef.current.lastUpdated === syncData.lastUpdated
        ) {
          return;
        }

        try {
          const player = youtubePlayerRef.current;
          if (player.duration <= 0) {
            return; // プレイヤー未準備の場合はスキップ
          }

          // 各種同期処理実行
          syncTime(player, syncData);
          syncPlayerState(player, syncData);
          syncPlaybackRate(player, syncData);

          // 処理済みデータを記録
          lastSyncDataRef.current = syncData;
        } catch (error) {
          console.error("Error during sync:", error);
        }
      },
      [syncTime, syncPlayerState, syncPlaybackRate]
    );

    // useXWinSyncからのイベントで同期処理を実行
    useEffect(() => {
      return onXWinSync((syncData) => {
        handleSyncData(syncData);
      });
    }, [onXWinSync, handleSyncData]);

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

        // 親コンポーネントに状態変更を通知
        onStatusChange?.(status);
      },
      [autoLoop, onStatusChange]
    );

    // 投影画面のマウント時に一度だけ初期同期を実行
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        // 初期同期実行
        const initialData = readFromStorage();
        if (initialData) {
          handleSyncData(initialData);
        }

        // 投影画面：確実にミュートに設定
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.mute();
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    }, [readFromStorage, handleSyncData]);

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
