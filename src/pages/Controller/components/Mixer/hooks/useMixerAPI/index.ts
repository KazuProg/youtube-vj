import type { MixerData } from "@/types";
import type { YouTubeVideoMetadata } from "@/types";
import { useEffect, useRef, useState } from "react";
import type { MixerAPI } from "../../types";

interface UseMixerAPIParams {
  mixerDataRef: React.MutableRefObject<MixerData | null>;
  setMixerData: (mixerData: MixerData) => void;
  setGlobalMixer: (mixer: MixerAPI | null) => void;
}

export const useMixerAPI = ({ mixerDataRef, setMixerData, setGlobalMixer }: UseMixerAPIParams) => {
  const mixerAPIRef = useRef<MixerAPI | null>(null);
  const [preparedVideo, setPreparedVideo] = useState<YouTubeVideoMetadata | null>(null);
  const preparedVideoRef = useRef<YouTubeVideoMetadata | null>(null);
  const [isAudioOn, setIsAudioOn] = useState<Record<number, boolean>>({});
  const [opacityValues, setOpacityValues] = useState<Record<number, number>>({});

  useEffect(() => {
    preparedVideoRef.current = preparedVideo;
  }, [preparedVideo]);

  useEffect(() => {
    mixerAPIRef.current = {
      setCrossfader: (value: number) => {
        setMixerData({
          ...(mixerDataRef.current ?? { crossfader: 0 }),
          crossfader: value,
        });
      },
      setPreparedVideo: (video: YouTubeVideoMetadata | string) => {
        const videoObj = typeof video === "string" ? { id: video } : video;
        setPreparedVideo(videoObj);
      },
      getPreparedVideo: () => {
        return preparedVideoRef.current;
      },
      setIsAudioOn: (deckId: number, state: boolean) => {
        setIsAudioOn((prev) => ({ ...prev, [deckId]: state }));
      },
      setOpacityValue: (deckId: number, value: number) => {
        setOpacityValues((prev) => ({ ...prev, [deckId]: value }));
      },
    } as MixerAPI;
    setGlobalMixer(mixerAPIRef.current);
  }, [setMixerData, setGlobalMixer, mixerDataRef]);

  return {
    mixerAPIRef,
    preparedVideo,
    isAudioOn,
    opacityValues,
  };
};
