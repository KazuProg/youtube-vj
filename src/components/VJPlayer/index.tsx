import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import YouTubePlayer from "./components/YouTubePlayer";
import { usePlayerSync } from "./hooks/usePlayerSync";
import type { VJPlayerInterface, VJPlayerRef, VJSyncData } from "./types";

interface VJPlayerEvents {
  onPaused?: () => void;
  onUnpaused?: () => void;
  onEnded?: () => void;
  onFiltersChange?: (filters: Record<string, string>) => void;
}

interface VJPlayerProps {
  className?: string;
  events?: VJPlayerEvents;
  syncKey?: string;
}

const VJPlayer = forwardRef<VJPlayerRef, VJPlayerProps>(
  ({ className, events, syncKey = DEFAULT_VALUES.syncKey }, ref) => {
    const playerRef = useRef<VJPlayerInterface | null>(null);
    const beforeFiltersRef = useRef<Record<string, string> | null>(null);

    const { getCurrentTime, setDuration, notifySyncData } = usePlayerSync(playerRef);

    const { data: syncData, setData: setSyncData } = useStorageSync<VJSyncData>(
      syncKey,
      INITIAL_SYNC_DATA as VJSyncData
    );

    useEffect(() => {
      if (syncData) {
        notifySyncData(syncData);
        if (syncData.filters !== beforeFiltersRef.current) {
          beforeFiltersRef.current = syncData.filters;
          events?.onFiltersChange?.(syncData.filters);
        }
      }
    }, [syncData, notifySyncData, events]);

    useImperativeHandle(
      ref,
      () => ({
        getPlayer: () => playerRef.current,
        getCurrentTime,
        setSyncData,
      }),
      [getCurrentTime, setSyncData]
    );

    return (
      <YouTubePlayer
        className={className}
        syncData={syncData}
        vjPlayerRef={playerRef}
        setDuration={setDuration}
        events={events}
      />
    );
  }
);

VJPlayer.displayName = "VJPlayer";

export default VJPlayer;
