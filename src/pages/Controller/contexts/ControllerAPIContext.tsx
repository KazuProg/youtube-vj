import { LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import type { DeckAPI } from "@/pages/Controller/components/Deck/types";
import type { LibraryAPI } from "@/pages/Controller/components/Library/types";
import type { MixerAPI } from "@/pages/Controller/components/Mixer/types";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { MIDIScriptManager } from "../types/MIDIScriptManager";
import type { SettingsData } from "../types/settings";

interface ControllerAPIContextValue {
  deckAPIs: (DeckAPI | null)[];
  setDeckAPI: (deckId: number, deckAPI: DeckAPI | null) => void;
  mixerAPI: MixerAPI | null;
  setMixerAPI: (mixer: MixerAPI | null) => void;
  libraryAPI: LibraryAPI | null;
  setLibraryAPI: (library: LibraryAPI | null) => void;
  midiAPI: MIDIScriptManager | null;
  setMidiAPI: (midi: MIDIScriptManager | null) => void;

  settings: SettingsData | null;
  setSettings: (settings: SettingsData | null) => void;
}

const ControllerAPIContext = createContext<ControllerAPIContextValue | null>(null);

export const ControllerAPIProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [deckAPIs, setDeckAPIs] = useState<(DeckAPI | null)[]>([]);
  const [mixerAPI, _setMixerAPI] = useState<MixerAPI | null>(null);
  const [libraryAPI, _setLibraryAPI] = useState<LibraryAPI | null>(null);
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

  const [settings, setSettings] = useState<SettingsData | null>(null);

  const { setData: _setSettings } = useStorageSync<SettingsData | null>(
    LOCAL_STORAGE_KEY.settings,
    (data) => {
      setSettings(data as SettingsData | null);
    }
  );

  useEffect(() => {
    _setSettings(settings);
  }, [_setSettings, settings]);

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

        settings,
        setSettings,
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
