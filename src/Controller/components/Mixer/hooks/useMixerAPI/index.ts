import type { MixerData } from "@/types";
import { useEffect } from "react";
import type { MixerAPI } from "../../types";

interface UseMixerAPIParams {
  setMixerData: (mixerData: MixerData | ((prev: MixerData | null) => MixerData)) => void;
}

export const useMixerAPI = ({ setMixerData }: UseMixerAPIParams) => {
  useEffect(() => {
    const mixerAPI: MixerAPI = {
      setCrossfader: (value: number) => {
        setMixerData((prev) => ({
          ...(prev ?? { crossfader: 0 }),
          crossfader: value,
        }));
      },
    };
    window.mixer = mixerAPI;
  }, [setMixerData]);
};
