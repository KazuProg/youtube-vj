import type { MixerData } from "@/types";
import { useEffect, useRef, useState } from "react";
import type { MixerAPI } from "../../types";

interface UseMixerAPIParams {
  setMixerData: (mixerData: MixerData | ((prev: MixerData | null) => MixerData)) => void;
  setGlobalMixer: (mixer: MixerAPI | null) => void;
}

export const useMixerAPI = ({ setMixerData, setGlobalMixer }: UseMixerAPIParams) => {
  const mixerAPIRef = useRef<MixerAPI | null>(null);
  const [preparedVideoId, setPreparedVideoId] = useState<string>("");
  const preparedVideoIdRef = useRef<string>("");

  useEffect(() => {
    preparedVideoIdRef.current = preparedVideoId;
  }, [preparedVideoId]);

  useEffect(() => {
    mixerAPIRef.current = {
      setCrossfader: (value: number) => {
        setMixerData((prev) => ({
          ...(prev ?? { crossfader: 0 }),
          crossfader: value,
        }));
      },
      setPreparedVideoId: (videoId: string) => {
        setPreparedVideoId(videoId);
      },
      getPreparedVideoId: () => {
        return preparedVideoIdRef.current;
      },
    } as MixerAPI;
    setGlobalMixer(mixerAPIRef.current);
  }, [setMixerData, setGlobalMixer]);

  return {
    mixerAPIRef,
    preparedVideoId,
  };
};
