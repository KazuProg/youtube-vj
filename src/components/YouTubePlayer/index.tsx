import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  DEFAULT_PLAYER_OPTIONS,
  type YTPlayer,
  type YTPlayerEventHandlers,
  type YTPlayerOptions,
} from "./types";
import { loadYouTubeIFrameAPI } from "./utils";

interface YouTubePlayerProps {
  className?: string;
  videoId: string;
  playerVars?: YTPlayerOptions["playerVars"];
  events?: YTPlayerEventHandlers;
}

const YouTubePlayer = ({ className, videoId, playerVars, events }: YouTubePlayerProps) => {
  const playerElementId = useId();
  const playerRef = useRef<YTPlayer | null>(null);
  const isInitializedRef = useRef(false);

  const [error, setError] = useState<string | null>(null);

  const initializePlayer = useCallback(async () => {
    try {
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
        events: events ?? undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      isInitializedRef.current = false;
    }
  }, [events, playerElementId, playerVars, videoId]);

  useEffect(() => {
    initializePlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      isInitializedRef.current = false;
      setError(null);
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
