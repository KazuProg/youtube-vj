import { useCallback, useEffect, useId, useRef, useState } from "react";
import styles from "./index.module.css";
import type { YTPlayer, YTPlayerEventHandlers, YTPlayerVars } from "./types";
import { loadYouTubeIFrameAPI } from "./utils";

interface YouTubePlayerProps {
  className?: string;
  videoId: string;
  playerVars?: YTPlayerVars;
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
        playerVars,
        events,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[YouTubePlayer] Failed to initialize player:", err);
      setError(errorMessage);
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
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          {error ? (
            <>
              <p>YouTube Player Error</p>
              <p className={styles.errorMessage}>{error}</p>
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
