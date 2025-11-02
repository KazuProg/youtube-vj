import type { DeckAPI } from "@/Controller/components/Deck/types";
import type { MixerAPI } from "@/Controller/components/Mixer/types";
import { createContext, useCallback, useContext, useState } from "react";

// レガシーAPI をグローバルに設定（自動実行）
import "@/utils/legacyAPI";

interface DeckAPIContextValue {
  deckAPIs: (DeckAPI | null)[];
  setDeckAPI: (deckId: number, deckAPI: DeckAPI | null) => void;
  setMixerAPI: (mixer: MixerAPI | null) => void;
}

const DeckAPIContext = createContext<DeckAPIContextValue | null>(null);

export const DeckAPIProvider = ({
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

    window.ch[deckId] = deckAPI;
  }, []);

  const setMixerAPI = useCallback((mixer: MixerAPI | null) => {
    window.mixer = mixer;
  }, []);

  return (
    <DeckAPIContext.Provider value={{ deckAPIs, setDeckAPI, setMixerAPI }}>
      {children}
    </DeckAPIContext.Provider>
  );
};

export const useDeckAPIContext = () => {
  const context = useContext(DeckAPIContext);
  if (!context) {
    throw new Error("useDeckAPIContext must be used within DeckAPIProvider");
  }
  return context;
};
