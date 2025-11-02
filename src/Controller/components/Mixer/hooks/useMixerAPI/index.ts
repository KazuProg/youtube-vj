import type { MixerData } from "@/types";
import { useEffect, useRef } from "react";
import type { MixerAPI } from "../../types";

interface UseMixerAPIParams {
  setMixerData: (mixerData: MixerData | ((prev: MixerData | null) => MixerData)) => void;
  setGlobalMixer: (mixer: MixerAPI | null) => void;
}

export const useMixerAPI = ({ setMixerData, setGlobalMixer }: UseMixerAPIParams) => {
  const mixerAPIRef = useRef<MixerAPI | null>(null);

  useEffect(() => {
    mixerAPIRef.current = {
      setCrossfader: (value: number) => {
        setMixerData((prev) => ({
          ...(prev ?? { crossfader: 0 }),
          crossfader: value,
        }));
      },
    } as MixerAPI;
    setGlobalMixer(mixerAPIRef.current);
  }, [setMixerData, setGlobalMixer]);

  return mixerAPIRef;
};
