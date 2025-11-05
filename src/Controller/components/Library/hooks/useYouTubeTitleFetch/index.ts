import { loadYouTubeIFrameAPI } from "@/components/VJPlayer/components/YouTubePlayer/utils";
import { useCallback, useRef } from "react";
import type { ExtendedYTPlayer } from "./types";

interface UseYouTubeTitleFetchReturn {
  fetchYouTubeTitle: (id: string) => Promise<string>;
  addManually: (id: string, title: string) => void;
}

function _fetchYouTubeTitle(id: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const playerElem = document.createElement("div");
    playerElem.style.display = "none";
    document.body.appendChild(playerElem);

    const cleanup = () => {
      if (playerElem.parentNode) {
        playerElem.parentNode.removeChild(playerElem);
      }
    };

    try {
      const player = new window.YT.Player(playerElem, {
        videoId: id,
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
          },
          onStateChange: (e) => {
            const extendedPlayer = e.target as ExtendedYTPlayer;
            const data = extendedPlayer.getVideoData();
            if (data.video_id === id) {
              player.destroy();
              cleanup();
              resolve(data.title);
            }
          },
          onError: () => {
            player.destroy();
            cleanup();
            reject(new Error(`Failed to fetch title for video ID: ${id}`));
          },
        },
      });
    } catch (e) {
      cleanup();
      reject(e);
    }
  });
}

export const useYouTubeTitleFetch = (): UseYouTubeTitleFetchReturn => {
  const cacheRef = useRef<Map<string, string>>(new Map());
  const pendingRef = useRef<Map<string, Promise<string>>>(new Map());

  // タイトル取得関数
  const fetchYouTubeTitle = useCallback(async (id: string): Promise<string> => {
    await loadYouTubeIFrameAPI();
    // キャッシュがある場合は即座に返す
    const cached = cacheRef.current.get(id);
    if (cached) {
      return Promise.resolve(cached);
    }

    // 既に取得中の場合は同じPromiseを返す
    const pending = pendingRef.current.get(id);
    if (pending) {
      return pending;
    }

    // 新しいPromiseを作成
    const promise = _fetchYouTubeTitle(id);
    pendingRef.current.set(id, promise);
    promise.then((title) => {
      cacheRef.current.set(id, title);
      pendingRef.current.delete(id);
    });
    promise.catch((error) => {
      pendingRef.current.delete(id);
      throw error;
    });
    return promise;
  }, []);

  // 手動でタイトルを追加
  const addManually = useCallback((id: string, title: string) => {
    cacheRef.current.set(id, title);
  }, []);

  return { fetchYouTubeTitle, addManually };
};

export default useYouTubeTitleFetch;
