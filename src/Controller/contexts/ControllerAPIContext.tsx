import type { DeckAPI } from "@/Controller/components/Deck/types";
import type { MixerAPI } from "@/Controller/components/Mixer/types";
import { createContext, useCallback, useContext, useState } from "react";

// レガシーAPI をグローバルに設定（自動実行）
import "@/utils/legacyAPI";

interface ControllerAPIContextValue {
  deckAPIs: (DeckAPI | null)[];
  setDeckAPI: (deckId: number, deckAPI: DeckAPI | null) => void;
  setMixerAPI: (mixer: MixerAPI | null) => void;
}

const ControllerAPIContext = createContext<ControllerAPIContextValue | null>(null);

export const ControllerAPIProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [deckAPIs, setDeckAPIs] = useState<(DeckAPI | null)[]>([]);

  const setDeckAPI = useCallback((deckId: number, deckAPI: DeckAPI | null) => {
    setDeckAPIs((prev) => {
      const newArray = [...prev];
      newArray[deckId] = deckAPI;
      return newArray;
    });

    window.ch ??= {};
    window.ch[deckId] = deckAPI;
  }, []);

  const setMixerAPI = useCallback((mixer: MixerAPI | null) => {
    window.mixer = mixer;
  }, []);

  return (
    <ControllerAPIContext.Provider value={{ deckAPIs, setDeckAPI, setMixerAPI }}>
      {children}
    </ControllerAPIContext.Provider>
  );
};

export const useControllerAPIContext = () => {
  const context = useContext(ControllerAPIContext);
  if (!context) {
    throw new Error("useControllerAPIContext must be used within ControllerAPIProvider");
  }
  return context;
};
