/**
 * YouTube iFrame API を直接使用する独自実装のプレイヤーコンポーネント
 * react-youtube ライブラリを完全に廃止し、Promise の複雑な処理を排除
 */

import {
  DEFAULT_PLAYER_OPTIONS,
  DEFAULT_VIDEO_ID,
  type YTPlayer,
  type YTPlayerEvent,
  type YTPlayerOptions,
} from "@/types/youtube";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

// コンポーネントの Props 型
interface YouTubePlayerProps {
  videoId?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: YTPlayerOptions["playerVars"];
  onReady?: (event: YTPlayerEvent) => void;
  onStateChange?: (event: YTPlayerEvent) => void;
  onPlaybackQualityChange?: (event: YTPlayerEvent) => void;
  onPlaybackRateChange?: (event: YTPlayerEvent) => void;
  onError?: (event: YTPlayerEvent) => void;
  onApiChange?: (event: YTPlayerEvent) => void;
  className?: string;
}

// コンポーネントの Ref 型
export interface YouTubePlayerRef {
  getPlayer: () => YTPlayer | null;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number | null;
  getDuration: () => number | null;
  getPlayerState: () => number | null;
  getVolume: () => number | null;
  getPlaybackRate: () => number | null;
  isMuted: () => boolean | null;
  loadVideoById: (videoId: string, startSeconds?: number, suggestedQuality?: string) => void;
  cueVideoById: (videoId: string, startSeconds?: number, suggestedQuality?: string) => void;
  destroy: () => void;
}

// YouTube iFrame API の動的読み込み関数（コンポーネント内で定義）

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  (
    {
      videoId = DEFAULT_VIDEO_ID,
      width = "100%",
      height = "100%",
      playerVars,
      onReady,
      onStateChange,
      onPlaybackQualityChange,
      onPlaybackRateChange,
      onError,
      onApiChange,
      className,
    },
    ref
  ) => {
    // console.log("YouTubePlayer component rendered with videoId:", videoId);
    // Refs
    const playerRef = useRef<YTPlayer | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const isInitializedRef = useRef(false);

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // console.log("Current state:", { isLoading, error });

    // YouTube iFrame API の動的読み込み
    const loadYouTubeAPI = useCallback((): Promise<void> => {
      return new Promise((resolve, reject) => {
        // console.log("Loading YouTube iFrame API...");

        // 既に読み込まれている場合
        if (window.YT?.Player) {
          // console.log("YouTube iFrame API already loaded");
          setIsLoading(false);
          resolve();
          return;
        }

        // 既に読み込み中の場合は待機
        if (window.onYouTubeIframeAPIReady) {
          // console.log("YouTube iFrame API already loading, waiting...");
          const originalCallback = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = () => {
            originalCallback();
            setIsLoading(false);
            resolve();
          };
          return;
        }

        // スクリプトを動的に読み込み
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.onerror = () => {
          setError("Failed to load YouTube iFrame API");
          reject(new Error("Failed to load YouTube iFrame API"));
        };

        window.onYouTubeIframeAPIReady = () => {
          setIsLoading(false);
          resolve();
        };

        document.head.appendChild(script);
      });
    }, []);

    // iframe の src を固定し、再初期化を防止
    const iframeSrc = useMemo(() => {
      const params = new URLSearchParams({
        enablejsapi: "1",
        origin: window.location.origin,
        ...(playerVars?.autoplay && { autoplay: "1" }),
        ...(playerVars?.controls !== undefined && {
          controls: playerVars.controls.toString(),
        }),
        ...(playerVars?.disablekb && { disablekb: "1" }),
        ...(playerVars?.iv_load_policy && {
          // biome-ignore lint/style/useNamingConvention: YouTube API official parameter name
          iv_load_policy: playerVars.iv_load_policy.toString(),
        }),
        ...(playerVars?.start && { start: playerVars.start.toString() }),
        ...(playerVars?.end && { end: playerVars.end.toString() }),
        ...(playerVars?.loop && { loop: "1" }),
        ...(playerVars?.fs !== undefined && { fs: playerVars.fs.toString() }),
        ...(playerVars?.cc_load_policy && {
          // biome-ignore lint/style/useNamingConvention: YouTube API official parameter name
          cc_load_policy: "1",
        }),
        ...(playerVars?.modestbranding && { modestbranding: "1" }),
        ...(playerVars?.rel !== undefined && {
          rel: playerVars.rel.toString(),
        }),
        ...(playerVars?.showinfo !== undefined && {
          showinfo: playerVars.showinfo.toString(),
        }),
      });

      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }, [videoId, playerVars]);

    // プレイヤー初期化
    const initializePlayer = useCallback(async () => {
      try {
        // console.log("Initializing YouTube player...");
        setIsLoading(true);
        setError(null);

        // console.log("Loading YouTube API...");
        await loadYouTubeAPI();
        // console.log("YouTube API loaded successfully");

        // console.log("iframeRef.current:", iframeRef.current);
        // console.log("isInitializedRef.current:", isInitializedRef.current);

        if (!iframeRef.current || isInitializedRef.current) {
          // console.log("Player already initialized or iframe not ready");
          return;
        }

        // console.log("Creating YouTube Player instance");
        isInitializedRef.current = true; // 初期化開始をマーク
        new window.YT.Player(iframeRef.current, {
          videoId,
          width,
          height,
          playerVars: {
            ...DEFAULT_PLAYER_OPTIONS.playerVars,
            ...playerVars,
          },
          events: {
            onReady: (event: YTPlayerEvent) => {
              playerRef.current = event.target;
              isInitializedRef.current = true;
              setIsLoading(false);
              onReady?.(event);
            },
            onStateChange: (event: YTPlayerEvent) => {
              onStateChange?.(event);
            },
            onPlaybackQualityChange: (event: YTPlayerEvent) => {
              onPlaybackQualityChange?.(event);
            },
            onPlaybackRateChange: (event: YTPlayerEvent) => {
              onPlaybackRateChange?.(event);
            },
            onError: (event: YTPlayerEvent) => {
              setError(`Player Error: ${event.data}`);
              onError?.(event);
            },
            onApiChange: (event: YTPlayerEvent) => {
              onApiChange?.(event);
            },
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
        isInitializedRef.current = false; // エラー時は初期化状態をリセット
      }
    }, [
      loadYouTubeAPI,
      onError,
      onReady,
      onStateChange,
      onPlaybackRateChange,
      onApiChange,
      onPlaybackQualityChange,
      videoId,
      width,
      height,
      playerVars,
    ]); // 必要な依存関係のみ

    // プレイヤー制御メソッド
    const playVideo = useCallback(() => {
      if (playerRef.current) {
        playerRef.current.playVideo();
      }
    }, []);

    const pauseVideo = useCallback(() => {
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
    }, []);

    const stopVideo = useCallback(() => {
      if (playerRef.current) {
        playerRef.current.stopVideo();
      }
    }, []);

    const seekTo = useCallback((seconds: number, allowSeekAhead = true) => {
      if (playerRef.current) {
        playerRef.current.seekTo(seconds, allowSeekAhead);
      }
    }, []);

    const setVolume = useCallback((volume: number) => {
      if (playerRef.current) {
        playerRef.current.setVolume(volume);
      }
    }, []);

    const setPlaybackRate = useCallback((rate: number) => {
      if (playerRef.current) {
        playerRef.current.setPlaybackRate(rate);
      }
    }, []);

    const mute = useCallback(() => {
      if (playerRef.current) {
        playerRef.current.mute();
      }
    }, []);

    const unMute = useCallback(() => {
      if (playerRef.current) {
        playerRef.current.unMute();
      }
    }, []);

    // 状態取得メソッド
    const getCurrentTime = useCallback((): number | null => {
      return playerRef.current ? playerRef.current.getCurrentTime() : null;
    }, []);

    const getDuration = useCallback((): number | null => {
      return playerRef.current ? playerRef.current.getDuration() : null;
    }, []);

    const getPlayerState = useCallback((): number | null => {
      return playerRef.current ? playerRef.current.getPlayerState() : null;
    }, []);

    const getVolume = useCallback((): number | null => {
      return playerRef.current ? playerRef.current.getVolume() : null;
    }, []);

    const getPlaybackRate = useCallback((): number | null => {
      return playerRef.current ? playerRef.current.getPlaybackRate() : null;
    }, []);

    const isMuted = useCallback((): boolean | null => {
      return playerRef.current ? playerRef.current.isMuted() : null;
    }, []);

    // 動画制御メソッド
    const loadVideoById = useCallback(
      (newVideoId: string, startSeconds?: number, suggestedQuality?: string) => {
        if (playerRef.current && isInitializedRef.current) {
          try {
            playerRef.current.loadVideoById(newVideoId, startSeconds, suggestedQuality);
          } catch {
            // エラーは無視して処理を継続
          }
        }
      },
      []
    );

    const cueVideoById = useCallback(
      (newVideoId: string, startSeconds?: number, suggestedQuality?: string) => {
        if (playerRef.current) {
          playerRef.current.cueVideoById(newVideoId, startSeconds, suggestedQuality);
        }
      },
      []
    );

    const destroy = useCallback(() => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        isInitializedRef.current = false;
      }
    }, []);

    // Ref API の公開
    useImperativeHandle(
      ref,
      () => ({
        getPlayer: () => playerRef.current,
        playVideo,
        pauseVideo,
        stopVideo,
        seekTo,
        setVolume,
        setPlaybackRate,
        mute,
        unMute,
        getCurrentTime,
        getDuration,
        getPlayerState,
        getVolume,
        getPlaybackRate,
        isMuted,
        loadVideoById,
        cueVideoById,
        destroy,
      }),
      [
        playVideo,
        pauseVideo,
        stopVideo,
        seekTo,
        setVolume,
        setPlaybackRate,
        mute,
        unMute,
        getCurrentTime,
        getDuration,
        getPlayerState,
        getVolume,
        getPlaybackRate,
        isMuted,
        loadVideoById,
        cueVideoById,
        destroy,
      ]
    );

    // iframe の onLoad イベントハンドラー
    const handleIframeLoad = useCallback(() => {
      if (iframeRef.current && !isInitializedRef.current) {
        initializePlayer();
      }
    }, [initializePlayer]);

    // 初期化（YouTube API の読み込みとプレイヤーの初期化）
    useEffect(() => {
      // YouTube API の読み込みを開始
      loadYouTubeAPI();

      // iframe がマウントされるまで待機
      const timer = setTimeout(() => {
        if (iframeRef.current && !isInitializedRef.current) {
          initializePlayer();
        }
      }, 500); // タイムアウトを500msに延長

      // クリーンアップ
      return () => {
        clearTimeout(timer);
        destroy();
      };
    }, [loadYouTubeAPI, initializePlayer, destroy]);

    // エラー表示
    if (error) {
      return (
        <div
          className={className}
          style={{
            width,
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f0f0f0",
          }}
        >
          <div style={{ textAlign: "center", color: "#666" }}>
            <p>YouTube Player Error</p>
            <p style={{ fontSize: "0.9em" }}>{error}</p>
          </div>
        </div>
      );
    }

    // ローディング表示
    if (isLoading) {
      return (
        <div
          className={className}
          style={{
            width,
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f0f0f0",
          }}
        >
          <div style={{ textAlign: "center", color: "#666" }}>
            <p>Loading YouTube Player...</p>
          </div>
        </div>
      );
    }

    // メインの iframe
    return (
      <iframe
        ref={iframeRef}
        className={className}
        src={iframeSrc}
        width={width}
        height={height}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: "none" }}
        title="YouTube Video Player"
        onLoad={handleIframeLoad}
      />
    );
  }
);

YouTubePlayer.displayName = "YouTubePlayer";

export default YouTubePlayer;
