/**
 * YouTube iFrame API を直接使用する独自実装のプレイヤーコンポーネント
 */

import {
  DEFAULT_PLAYER_OPTIONS,
  type YTPlayer,
  type YTPlayerEvent,
  type YTPlayerOptions,
} from "@/types/youtube";
import loadYouTubeIFrameAPI from "@/utils/loadYouTubeIFrameAPI";
import waitForElementRendered from "@/utils/waitForElementRendered";
import { useCallback, useEffect, useId, useRef, useState } from "react";

// コンポーネントの Props 型
interface YouTubePlayerProps {
  className?: string;
  videoId: string;
  playerVars?: YTPlayerOptions["playerVars"];
  onReady?: (event: YTPlayerEvent) => void;
  onStateChange?: (event: YTPlayerEvent) => void;
  onPlaybackQualityChange?: (event: YTPlayerEvent) => void;
  onPlaybackRateChange?: (event: YTPlayerEvent) => void;
  onError?: (event: YTPlayerEvent) => void;
  onApiChange?: (event: YTPlayerEvent) => void;
}

const YouTubePlayer = ({
  className,
  videoId,
  playerVars,
  onReady,
  onStateChange,
  onPlaybackQualityChange,
  onPlaybackRateChange,
  onError,
  onApiChange,
}: YouTubePlayerProps) => {
  const playerElementId = useId();
  const playerRef = useRef<YTPlayer | null>(null);
  const isInitializedRef = useRef(false);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // プレイヤー初期化
  const initializePlayer = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await loadYouTubeIFrameAPI();

      if (isInitializedRef.current) {
        return;
      }

      setIsLoading(false); // iframe 要素を読み込むために false にする
      isInitializedRef.current = true; // 初期化開始をマーク

      await waitForElementRendered(playerElementId);

      new window.YT.Player(playerElementId, {
        videoId,
        playerVars: {
          ...DEFAULT_PLAYER_OPTIONS.playerVars,
          ...playerVars,
        },
        events: {
          onReady: (event: YTPlayerEvent) => {
            playerRef.current = event.target;
            isInitializedRef.current = true;
            setIsLoading(false);
            onReady?.(event);
          },
          onStateChange: onStateChange,
          onPlaybackQualityChange: onPlaybackQualityChange,
          onPlaybackRateChange: onPlaybackRateChange,
          onError: onError,
          onApiChange: onApiChange,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsLoading(false);
      isInitializedRef.current = false; // エラー時は初期化状態をリセット
    }
  }, [
    onError,
    onReady,
    onStateChange,
    onPlaybackRateChange,
    onApiChange,
    onPlaybackQualityChange,
    videoId,
    playerVars,
    playerElementId,
  ]); // 必要な依存関係のみ

  // 初期化（YouTube API の読み込みとプレイヤーの初期化）
  useEffect(() => {
    initializePlayer();

    // クリーンアップ
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [initializePlayer]);

  // エラー表示
  if (error) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f0",
        }}
      >
        <div style={{ textAlign: "center", color: "#666" }}>
          <p>YouTube Player Error</p>
          <p style={{ fontSize: "0.9em" }}>{error}</p>
        </div>
      </div>
    );
  }

  // ローディング表示
  if (isLoading) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f0",
        }}
      >
        <div style={{ textAlign: "center", color: "#666" }}>
          <p>Loading YouTube Player...</p>
        </div>
      </div>
    );
  }

  return <div id={playerElementId} className={className} style={{ border: "none" }} />;
};

YouTubePlayer.displayName = "YouTubePlayer";

export default YouTubePlayer;
