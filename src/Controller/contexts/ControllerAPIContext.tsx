import type { DeckAPI } from "@/Controller/components/Deck/types";
import type { LibraryAPI } from "@/Controller/components/Library/types";
import type { MixerAPI } from "@/Controller/components/Mixer/types";
import type { MIDIScriptManager } from "@/types/global";
import { createContext, useCallback, useContext, useState } from "react";

// レガシーAPI をグローバルに設定（自動実行）
import "@/utils/legacyAPI";

interface ControllerAPIContextValue {
  deckAPIs: (DeckAPI | null)[];
  setDeckAPI: (deckId: number, deckAPI: DeckAPI | null) => void;
  mixerAPI: MixerAPI | null;
  setMixerAPI: (mixer: MixerAPI | null) => void;
  libraryAPI: LibraryAPI | null;
  setLibraryAPI: (library: LibraryAPI | null) => void;
  midiAPI: MIDIScriptManager | null;
  setMidiAPI: (midi: MIDIScriptManager | null) => void;
}

const ControllerAPIContext = createContext<ControllerAPIContextValue | null>(null);

export const ControllerAPIProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [deckAPIs, setDeckAPIs] = useState<(DeckAPI | null)[]>([]);
  const [libraryAPI, _setLibraryAPI] = useState<LibraryAPI | null>(null);
  const [mixerAPI, _setMixerAPI] = useState<MixerAPI | null>(null);
  const [midiAPI, setMidiAPI] = useState<MIDIScriptManager | null>(null);

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
    _setMixerAPI(mixer);
    window.mixer = mixer;
  }, []);

  const setLibraryAPI = useCallback((library: LibraryAPI | null) => {
    _setLibraryAPI(library);
    window.library = library;
  }, []);

  return (
    <ControllerAPIContext.Provider
      value={{
        deckAPIs,
        setDeckAPI,
        mixerAPI,
        setMixerAPI,
        libraryAPI,
        setLibraryAPI,
        midiAPI,
        setMidiAPI,
      }}
    >
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
