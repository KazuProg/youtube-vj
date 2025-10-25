import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  DEFAULT_PLAYER_OPTIONS,
  type YTPlayer,
  type YTPlayerEvent,
  type YTPlayerOptions,
} from "./types";
import { loadYouTubeIFrameAPI } from "./utils";

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

  const [error, setError] = useState<string | null>(null);

  const initializePlayer = useCallback(async () => {
    try {
      setError(null);

      await loadYouTubeIFrameAPI();

      if (isInitializedRef.current) {
        return;
      }

      isInitializedRef.current = true;

      playerRef.current = new window.YT.Player(playerElementId, {
        videoId,
        playerVars: {
          ...DEFAULT_PLAYER_OPTIONS.playerVars,
          ...playerVars,
        },
        events: {
          onReady: onReady,
          onStateChange: onStateChange,
          onPlaybackQualityChange: onPlaybackQualityChange,
          onPlaybackRateChange: onPlaybackRateChange,
          onError: onError,
          onApiChange: onApiChange,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      isInitializedRef.current = false;
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
  ]);

  useEffect(() => {
    initializePlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [initializePlayer]);

  return (
    <div id={playerElementId} className={className}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #666",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", color: "#666" }}>
          {error ? (
            <>
              <p>YouTube Player Error</p>
              <p style={{ fontSize: "0.9rem" }}>{error}</p>
            </>
          ) : (
            <p>Loading YouTube Player...</p>
          )}
        </div>
      </div>
    </div>
  );
};

YouTubePlayer.displayName = "YouTubePlayer";

export default YouTubePlayer;
