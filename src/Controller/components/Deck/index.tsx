import Fader from "@/components/Fader";
import VJPlayer from "@/components/VJPlayer";
import type { VJPlayerRef, VJSyncData } from "@/components/VJPlayer/types";
import { type YTPlayerEvent, YT_PLAYER_STATE } from "@/components/YouTubePlayer/types";
import { INITIAL_SYNC_DATA } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { useCallback, useEffect, useRef, useState } from "react";
import SeekBar from "./components/SeekBar";
import styles from "./index.module.css";
import type { DeckAPI } from "./types";

interface DeckProps {
  localStorageKey: string;
  setGlobalPlayer: (player: DeckAPI | null) => void;
  className?: string;
}

const Deck = ({ localStorageKey, setGlobalPlayer, className }: DeckProps) => {
  const vjPlayerRef = useRef<VJPlayerRef | null>(null);
  const { data: syncData, setData: setSyncData } = useStorageSync<VJSyncData>(localStorageKey, {
    defaultValue: INITIAL_SYNC_DATA,
    overwrite: true,
  });
  const syncDataRef = useRef<VJSyncData>(syncData);
  const deckAPIRef = useRef<DeckAPI | null>(null);

  // UI用のstate
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const getCurrentTime = (): number => {
    return vjPlayerRef.current?.getCurrentTime() ?? 0;
  };

  useEffect(() => {
    syncDataRef.current = syncData;
  }, [syncData]);

  const updateSyncData = useCallback(
    (partialSyncData: Partial<VJSyncData>) => {
      const previousSyncData = syncDataRef.current;
      // undefinedの値を除外してマージ
      const filteredPartialData = Object.fromEntries(
        Object.entries(partialSyncData).filter(([_, value]) => value !== undefined)
      );
      const newSyncData = {
        ...previousSyncData,
        ...filteredPartialData,
      } as VJSyncData;
      setSyncData(newSyncData);

      if (previousSyncData?.playbackRate !== newSyncData.playbackRate) {
        setPlaybackRate(newSyncData.playbackRate);
      }
    },
    [setSyncData]
  );

  useEffect(() => {
    deckAPIRef.current = {
      playVideo: () => {
        updateSyncData({
          baseTime: Date.now(),
          paused: false,
        });
      },
      pauseVideo: () => {
        updateSyncData({
          baseTime: Date.now(),
          currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
          paused: true,
        });
      },
      isPlaying: () => {
        return syncDataRef.current?.paused === false;
      },
      seekTo: (seconds: number, _allowSeekAhead: boolean) => {
        updateSyncData({
          ...syncDataRef.current,
          baseTime: Date.now(),
          currentTime: seconds,
        });
      },
      mute: () => {
        vjPlayerRef.current?.getPlayer()?.mute();
      },
      unMute: () => {
        vjPlayerRef.current?.getPlayer()?.unMute();
      },
      isMuted: () => {
        return vjPlayerRef.current?.getPlayer()?.isMuted() ?? false;
      },
      setVolume: (volume: number) => {
        vjPlayerRef.current?.getPlayer()?.setVolume(volume);
      },
      setPlaybackRate: (rate: number) => {
        updateSyncData({
          currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
          baseTime: Date.now(),
          playbackRate: Number.parseFloat(rate.toFixed(2)),
        });
      },
      loadVideoById: (newVideoId: string) => {
        updateSyncData({
          videoId: newVideoId,
          currentTime: 0,
          baseTime: Date.now(),
          paused: false,
        });
      },
      getCurrentTime: () => {
        return vjPlayerRef.current?.getCurrentTime() ?? 0;
      },
      getDuration: () => {
        return vjPlayerRef.current?.getPlayer()?.getDuration() ?? 0;
      },
    } as DeckAPI;
    setGlobalPlayer(deckAPIRef.current);
  }, [setGlobalPlayer, updateSyncData]);

  useEffect(() => {
    deckAPIRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    deckAPIRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  useEffect(() => {
    if (isMuted) {
      deckAPIRef.current?.mute();
    } else {
      deckAPIRef.current?.unMute();
    }
  }, [isMuted]);

  const handleStateChange = useCallback(
    (e: YTPlayerEvent) => {
      //return;
      const playerState = e.data;

      if (playerState === YT_PLAYER_STATE.UNSTARTED) {
        updateSyncData({
          currentTime: 0,
          baseTime: Date.now(),
        });
      }

      if (playerState === YT_PLAYER_STATE.PAUSED && !syncDataRef.current?.paused) {
        updateSyncData({
          currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
          baseTime: Date.now(),
          paused: true,
        });
      }
      if (playerState !== YT_PLAYER_STATE.PAUSED && syncDataRef.current?.paused) {
        updateSyncData({
          baseTime: Date.now(),
          paused: false,
        });
      }

      if (playerState === YT_PLAYER_STATE.ENDED) {
        updateSyncData({
          currentTime: 0,
          baseTime: Date.now(),
        });
      }
    },
    [updateSyncData]
  );

  return (
    <div className={`${styles.container} ${className}`}>
      <fieldset>
        <legend>Preview</legend>
        <VJPlayer
          className={styles.player}
          ref={vjPlayerRef}
          onStateChange={handleStateChange}
          syncKey={localStorageKey}
        />
        <SeekBar
          currentTimeFunc={getCurrentTime}
          durationFunc={() => deckAPIRef.current?.getDuration() ?? 0}
          onSeek={(time: number) => deckAPIRef.current?.seekTo(time, true)}
        />
      </fieldset>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          gap: "20px",
        }}
      >
        <fieldset style={{ flex: 1 }}>
          <legend>
            <button
              type="button"
              onClick={() => setPlaybackRate(1)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  setPlaybackRate(1);
                }
              }}
            >
              Speed
            </button>
          </legend>
          <Fader
            min={0.5}
            max={1.5}
            value={playbackRate}
            step={0.01}
            vertical={true}
            reverse={true}
            style={{
              width: "50px",
              height: "150px",
            }}
            onChange={setPlaybackRate}
          />
          <span>{playbackRate.toFixed(2)}x</span>
        </fieldset>
        <fieldset style={{ flex: 1 }}>
          <legend>
            <button
              type="button"
              style={{
                ...(isMuted
                  ? {
                      color: "#f88",
                    }
                  : {}),
              }}
              onClick={() => setIsMuted(!isMuted)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  setIsMuted(!isMuted);
                }
              }}
            >
              Volume
            </button>
          </legend>
          <Fader
            min={0}
            max={100}
            value={volume}
            step={1}
            vertical={true}
            style={{
              width: "50px",
              height: "150px",
            }}
            onChange={(e) => setVolume(e)}
          />
          <span
            style={{
              ...(isMuted
                ? {
                    textDecoration: "line-through",
                  }
                : {}),
            }}
          >
            {volume.toFixed(0)}%
          </span>
        </fieldset>
      </div>
      <fieldset>
        <legend>Seek</legend>
        <div className={styles.seekButtons}>
          <button
            type="button"
            onClick={() => {
              const newTime = getCurrentTime() - 1;
              deckAPIRef.current?.seekTo(newTime, true);
            }}
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => {
              const newTime = getCurrentTime() + 1;
              deckAPIRef.current?.seekTo(newTime, true);
            }}
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => {
              const newTime = getCurrentTime() - 0.1;
              deckAPIRef.current?.seekTo(newTime, true);
            }}
          >
            -0.1
          </button>
          <button
            type="button"
            onClick={() => {
              const newTime = getCurrentTime() + 0.1;
              deckAPIRef.current?.seekTo(newTime, true);
            }}
          >
            +0.1
          </button>
        </div>
      </fieldset>
    </div>
  );
};

export default Deck;
