import type { DeckAPI } from "@/Controller/components/Deck/types";
import type { MixerAPI } from "@/Controller/components/Mixer/types";
import { useCallback } from "react";

/**
 * グローバルAPI管理フック
 *
 * 外部スクリプトからアクセス可能なグローバルAPIを管理します。
 * 型安全性を保ちつつ、windowオブジェクトを通じて外部から操作可能にします。
 */
interface UseGlobalAPIResult {
  /**
   * DeckAPIインスタンスをグローバルに設定する関数
   * @param deckId デッキID (0, 1, ...)
   * @param player DeckAPIインスタンス
   * 例: setGlobalPlayer(0, player) -> window.ch0 = player
   *      setGlobalPlayer(1, player) -> window.ch1 = player
   */
  setGlobalPlayer: (deckId: number, player: DeckAPI | null) => void;
  /**
   * MixerAPIインスタンスをグローバルに設定する関数
   * window.mixer に最新のAPIを設定します
   */
  setGlobalMixer: (mixer: MixerAPI | null) => void;
}

export const useGlobalAPI = (): UseGlobalAPIResult => {
  // デッキIDに応じてwindow.ch0, window.ch1などに設定する関数
  const setGlobalPlayer = useCallback((deckId: number, player: DeckAPI | null) => {
    if (deckId === 0) {
      window.ch0 = player;
    }
  }, []);

  // window.mixer を設定する関数
  const setGlobalMixer = useCallback((mixer: MixerAPI | null) => {
    window.mixer = mixer;
  }, []);

  return { setGlobalPlayer, setGlobalMixer };
};
