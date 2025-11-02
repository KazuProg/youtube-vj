import { useDeckAPIContext } from "@/Controller/contexts/DeckAPIContext";
import type { VJPlayerRef, VJSyncData } from "@/components/VJPlayer/types";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { DeckAPI } from "../../types";

interface UseDeckAPIParams {
  vjPlayerRef: RefObject<VJPlayerRef | null>;
  syncDataRef: RefObject<VJSyncData>;
  updateSyncData: (partialSyncData: Partial<VJSyncData>) => void;
  deckId: number;
  setGlobalPlayer: (deckId: number, player: DeckAPI | null) => void;
}

export const useDeckAPI = ({
  vjPlayerRef,
  syncDataRef,
  updateSyncData,
  deckId,
  setGlobalPlayer,
}: UseDeckAPIParams) => {
  const deckAPIRef = useRef<DeckAPI | null>(null);
  const { setDeckAPI } = useDeckAPIContext();

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
    setGlobalPlayer(deckId, deckAPIRef.current);
    setDeckAPI(deckId, deckAPIRef.current);
  }, [deckId, setGlobalPlayer, setDeckAPI, updateSyncData, vjPlayerRef, syncDataRef]);

  return deckAPIRef;
};
