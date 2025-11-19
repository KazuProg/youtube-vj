import Fader from "@/components/Fader";
import VJPlayer from "@/components/VJPlayer";
import type { VJPlayerRef, VJSyncData } from "@/components/VJPlayer/types";
import { INITIAL_SYNC_DATA } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SeekBar from "./components/SeekBar";
import { useDeckAPI } from "./hooks/useDeckAPI";
import styles from "./index.module.css";

interface DeckProps {
  localStorageKey: string;
  deckId: number;
  className?: string;
}

const Deck = ({ localStorageKey, deckId, className }: DeckProps) => {
  const vjPlayerRef = useRef<VJPlayerRef | null>(null);
  const { dataRef: syncDataRef, setData: setSyncData } = useStorageSync<VJSyncData>(
    localStorageKey,
    null,
    {
      defaultValue: INITIAL_SYNC_DATA,
      overwrite: true,
    }
  );

  // UI用のstate
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hotCues, setHotCues] = useState<Map<number, number>>(new Map());
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const getCurrentTime = (): number => {
    return vjPlayerRef.current?.getCurrentTime() ?? 0;
  };

  const updateSyncData = useCallback(
    (partialSyncData: Partial<VJSyncData>) => {
      const previousSyncData = syncDataRef.current;
      if (previousSyncData === null) {
        return;
      }
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
    [setSyncData, syncDataRef]
  );

  const deckAPIRef = useDeckAPI({
    vjPlayerRef,
    syncDataRef,
    updateSyncData,
    deckId,
    onHotCuesChange: setHotCues,
    onVolumeChange: setVolume,
    onMuteChange: setIsMuted,
  });

  useEffect(() => {
    deckAPIRef.current?.setVolume(volume);
  }, [volume, deckAPIRef]);

  useEffect(() => {
    deckAPIRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate, deckAPIRef]);

  useEffect(() => {
    if (isMuted) {
      deckAPIRef.current?.mute();
    } else {
      deckAPIRef.current?.unMute();
    }
  }, [isMuted, deckAPIRef]);

  const vjPlayerEventsRef = useRef({
    onUnstarted: () => {
      updateSyncData({
        currentTime: 0,
        baseTime: Date.now(),
      });
    },
    onPaused: () => {
      updateSyncData({
        currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
        baseTime: Date.now(),
        paused: true,
      });
    },
    onUnpaused: () => {
      updateSyncData({
        baseTime: Date.now(),
        paused: false,
      });
    },
    onEnded: () => {
      updateSyncData({
        currentTime: 0,
        baseTime: Date.now(),
      });
    },
  });

  // updateSyncDataが変更されたときにイベントハンドラーを更新
  useEffect(() => {
    vjPlayerEventsRef.current = {
      onUnstarted: () => {
        updateSyncData({
          currentTime: 0,
          baseTime: Date.now(),
        });
      },
      onPaused: () => {
        updateSyncData({
          currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
          baseTime: Date.now(),
          paused: true,
        });
      },
      onUnpaused: () => {
        updateSyncData({
          baseTime: Date.now(),
          paused: false,
        });
      },
      onEnded: () => {
        updateSyncData({
          currentTime: 0,
          baseTime: Date.now(),
        });
      },
    };
  }, [updateSyncData]);

  const vjPlayerEvents = useMemo(
    () => ({
      onUnstarted: () => vjPlayerEventsRef.current.onUnstarted(),
      onPaused: () => vjPlayerEventsRef.current.onPaused(),
      onUnpaused: () => vjPlayerEventsRef.current.onUnpaused(),
      onEnded: () => vjPlayerEventsRef.current.onEnded(),
    }),
    []
  );

  const adjustTime = (relativeTime: number) => {
    const newTime = getCurrentTime() + relativeTime;
    deckAPIRef.current?.seekTo(newTime, true);
  };

  return (
    <div className={`${styles.deck} ${className}`}>
      <fieldset>
        <legend>Preview</legend>
        <VJPlayer
          className={styles.player}
          ref={vjPlayerRef}
          events={vjPlayerEvents}
          syncKey={localStorageKey}
        />
        <SeekBar
          currentTimeFunc={getCurrentTime}
          durationFunc={() => deckAPIRef.current?.getDuration() ?? 0}
          hotCues={hotCues}
          onSeek={(time: number) => deckAPIRef.current?.seekTo(time, true)}
        />
      </fieldset>
      <div className={styles.controlsContainer}>
        <fieldset>
          <legend>Adjust</legend>
          <div className={styles.adjust}>
            <button
              type="button"
              onClick={() => {
                adjustTime(-5);
              }}
            >
              &lt;
            </button>
            <span>5s</span>
            <button
              type="button"
              onClick={() => {
                adjustTime(5);
              }}
            >
              &gt;
            </button>
            <button
              type="button"
              onClick={() => {
                adjustTime(-1);
              }}
            >
              &lt;
            </button>
            <span>1s</span>
            <button
              type="button"
              onClick={() => {
                adjustTime(1);
              }}
            >
              &gt;
            </button>
            <button
              type="button"
              onClick={() => {
                adjustTime(-0.1);
              }}
            >
              &lt;
            </button>
            <span>0.1s</span>
            <button
              type="button"
              onClick={() => {
                adjustTime(0.1);
              }}
            >
              &gt;
            </button>
          </div>
        </fieldset>
        <fieldset className={styles.controlFieldset}>
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
            className={styles.fader}
            onChange={setPlaybackRate}
          />
          <span>{playbackRate.toFixed(2)}x</span>
        </fieldset>
        <fieldset className={styles.controlFieldset}>
          <legend>
            <button
              type="button"
              className={isMuted ? styles.mutedButton : undefined}
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
            className={styles.fader}
            onChange={setVolume}
          />
          <span className={isMuted ? styles.mutedText : undefined}>{volume.toFixed(0)}%</span>
        </fieldset>
      </div>
    </div>
  );
};

export default Deck;
