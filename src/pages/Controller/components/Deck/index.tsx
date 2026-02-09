import Fader from "@/components/Fader";
import VJPlayer from "@/components/VJPlayer";
import type { VJPlayerRef, VJSyncData } from "@/components/VJPlayer/types";
import { INITIAL_SYNC_DATA } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useControllerAPIContext } from "../../contexts/ControllerAPIContext";
import SeekBar from "./components/SeekBar";
import { useDeckAPI } from "./hooks/useDeckAPI";
import styles from "./index.module.css";

interface DeckProps {
  localStorageKey: string;
  deckId: number;
  className?: string;
  initialPaused?: boolean;
}

const Deck = ({ localStorageKey, deckId, className, initialPaused = false }: DeckProps) => {
  const vjPlayerRef = useRef<VJPlayerRef | null>(null);
  const { dataRef: syncDataRef, setData: setSyncData } = useStorageSync<VJSyncData>(
    localStorageKey,
    { ...INITIAL_SYNC_DATA, paused: initialPaused },
    { overwrite: true }
  );
  const { mixerAPI } = useControllerAPIContext();

  // UI用のstate
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hotCues, setHotCues] = useState<Map<number, number>>(new Map());
  const [loopMarkers, setLoopMarkers] = useState<number[]>([]);

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

      setLoopMarkers(
        [newSyncData.loopStart, newSyncData.loopEnd].filter((v): v is number => v !== null)
      );
    },
    [setSyncData, syncDataRef]
  );

  const handleMuteChange = useCallback(
    (isMuted: boolean) => {
      mixerAPI?.setIsAudioOn(deckId, !isMuted);
    },
    [mixerAPI, deckId]
  );

  const handleOpacityChange = useCallback(
    (opacity: number) => {
      mixerAPI?.setOpacityValue(deckId, opacity);
    },
    [mixerAPI, deckId]
  );

  const deckAPIRef = useDeckAPI({
    vjPlayerRef,
    syncDataRef,
    updateSyncData,
    deckId,
    onHotCuesChange: setHotCues,
    onMuteChange: handleMuteChange,
    onOpacityChange: handleOpacityChange,
  });

  useEffect(() => {
    deckAPIRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate, deckAPIRef]);

  const vjPlayerEvents = useMemo(
    () => ({
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
    }),
    [updateSyncData]
  );

  return (
    <div className={`${styles.deck} ${className}`}>
      <div>
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
          loopMarkers={loopMarkers}
          onSeek={(time: number) => deckAPIRef.current?.seekTo(time)}
        />
      </div>
      <div className={styles.controlsContainer}>
        <fieldset className={styles.controlFieldset}>
          <legend>Adjust</legend>
          <div className={styles.adjust}>
            <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(-5)}>
              &lt;
            </button>
            <span>5s</span>
            <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(5)}>
              &gt;
            </button>
            <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(-1)}>
              &lt;
            </button>
            <span>1s</span>
            <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(1)}>
              &gt;
            </button>
            <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(-0.1)}>
              &lt;
            </button>
            <span>0.1s</span>
            <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(0.1)}>
              &gt;
            </button>
          </div>
        </fieldset>
        <fieldset className={styles.controlFieldset}>
          <legend>
            <button
              className={styles.speedButton}
              type="button"
              onClick={() => {
                setPlaybackRate(1);
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
          <input
            className={styles.speedInput}
            type="number"
            min={0.25}
            max={2}
            step={0.01}
            value={playbackRate.toFixed(2)}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
          />
        </fieldset>
      </div>
    </div>
  );
};

export default Deck;
