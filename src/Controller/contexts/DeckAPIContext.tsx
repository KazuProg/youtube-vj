import type { DeckAPI } from "@/Controller/components/Deck/types";
import { createContext, useCallback, useContext, useState } from "react";

interface DeckAPIContextValue {
  deckAPIs: (DeckAPI | null)[];
  setDeckAPI: (deckId: number, deckAPI: DeckAPI | null) => void;
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
  }, []);

  return (
    <DeckAPIContext.Provider value={{ deckAPIs, setDeckAPI }}>{children}</DeckAPIContext.Provider>
  );
};

export const useDeckAPIContext = () => {
  const context = useContext(DeckAPIContext);
  if (!context) {
    throw new Error("useDeckAPIContext must be used within DeckAPIProvider");
  }
  return context;
};
