import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useXWinSync } from "../hooks/useXWinSync";
import type {
  PlayerStatus,
  VJControllerRef,
  VJPlayerProps,
  VJPlayerRef,
  VJSyncData,
} from "../types/vj";
import { DEFAULT_VALUES, INITIAL_SYNC_DATA } from "../types/vj";
import VJPlayer from "./VJPlayer";

const VJPlayerForController = forwardRef<VJControllerRef, VJPlayerProps>(
  (
    {
      style,
      onStatusChange,
      autoLoop = true,
      syncKey = DEFAULT_VALUES.syncKey,
      videoId = DEFAULT_VALUES.videoId,
    },
    ref
  ) => {
    const vjPlayerRef = useRef<VJPlayerRef | null>(null);
    const previousStatusRef = useRef<PlayerStatus | null>(null);
    const lastSeekTimeRef = useRef<number>(0);
    const isInitializedRef = useRef(false);

    // プレイヤー状態
    const [volume, setVolume] = useState<number>(DEFAULT_VALUES.volume);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [duration, setDuration] = useState<number>(0);
    const [playerState, setPlayerState] = useState<number>(0);

    const { writeToStorage: writeToXWinSync } = useXWinSync(syncKey);
    const syncDataRef = useRef<VJSyncData>(INITIAL_SYNC_DATA);

    // syncDataRefを更新し、同時にwriteToXWinSyncを呼び出す
    const updateSyncData = useCallback(
      (partialSyncData: Partial<VJSyncData>) => {
        const newSyncData = { ...syncDataRef.current, ...partialSyncData };
        syncDataRef.current = newSyncData;
        writeToXWinSync(newSyncData);
      },
      [writeToXWinSync]
    );

    // プレイヤー取得
    const getPlayer = useCallback(() => {
      return vjPlayerRef.current?.originalPlayer;
    }, []);

    // 初期化時のみ実行
    useEffect(() => {
      updateSyncData({ ...INITIAL_SYNC_DATA });
    }, [updateSyncData]);

    // 安全な非同期プレイヤー操作
    const safePlayerOperation = useCallback(
      async (operation: () => Promise<void> | void) => {
        if (!isInitializedRef.current || !getPlayer()) {
          return;
        }

        try {
          await operation();
        } catch (error) {
          console.warn("Player operation failed:", error);
        }
      },
      [getPlayer]
    );

    // ストレージ保存
    const saveToStorage = useCallback(
      (status: PlayerStatus, forceSync = false) => {
        const prev = previousStatusRef.current;

        const shouldSync =
          forceSync ||
          !prev ||
          prev.playerState !== status.playerState ||
          Math.abs(prev.playbackRate - status.playbackRate) > 0.01 ||
          Math.abs(prev.duration - status.duration) > 1;

        if (!shouldSync) {
          return;
        }

        updateSyncData({
          playbackRate: status.playbackRate,
          currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
          lastUpdated: Date.now(),
          paused: status.playerState === 2,
        });
      },
      [updateSyncData]
    );

    // シーク位置の保存（デバウンス付き）
    const saveSeekPosition = useCallback(
      (targetTime: number) => {
        const now = Date.now();
        if (now - lastSeekTimeRef.current < DEFAULT_VALUES.seekDebounce) {
          return;
        }
        lastSeekTimeRef.current = now;

        const currentStatus = previousStatusRef.current;
        if (!currentStatus) {
          return;
        }

        updateSyncData({
          currentTime: targetTime,
          lastUpdated: now,
        });
      },
      [updateSyncData]
    );

    // 子プレイヤーの状態変更処理
    const handleStatusChange = useCallback(
      (status: PlayerStatus) => {
        // 自動ループ処理
        if (autoLoop && status.playerState === 0) {
          saveSeekPosition(0);
        }

        // 状態の更新
        setPlayerState(status.playerState);
        setDuration(status.duration);

        // ストレージ保存
        saveToStorage(status);
        previousStatusRef.current = status;

        // 親への通知
        onStatusChange?.(status);
      },
      [autoLoop, onStatusChange, saveToStorage, saveSeekPosition]
    );

    // 音量・ミュート設定の適用
    useEffect(() => {
      safePlayerOperation(async () => {
        const player = getPlayer();
        if (!player) {
          return;
        }

        if (isMuted) {
          await player.mute();
        } else {
          await player.unMute();
          await player.setVolume(volume);
        }
      });
    }, [volume, isMuted, safePlayerOperation, getPlayer]);

    // 初期化完了フラグの設定
    useEffect(() => {
      if (vjPlayerRef.current) {
        isInitializedRef.current = true;
      }
    }, []);

    // 外部API（useImperativeHandle）
    useImperativeHandle(
      ref,
      () => ({
        // 制御メソッド
        playVideo: () => {
          updateSyncData({
            lastUpdated: Date.now(), // 再生開始時間の記録
            paused: false,
          });
        },
        pauseVideo: () => {
          updateSyncData({
            currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0, // 一時停止位置の記録
            paused: true,
          });
        },
        seekTo: (seconds: number) => {
          updateSyncData({
            currentTime: seconds,
            lastUpdated: Date.now(),
          });
        },
        mute: () => setIsMuted(true),
        unMute: () => setIsMuted(false),
        setVolume: (newVolume: number) => setVolume(Math.max(0, Math.min(100, newVolume))),
        setPlaybackRate: (rate: number) => {
          updateSyncData({
            playbackRate: rate,
          });
        },
        getCurrentTime: () => {
          try {
            return vjPlayerRef.current?.getCurrentTime() ?? null;
          } catch (error) {
            console.warn("Failed to get current time:", error);
            return null;
          }
        },

        // 状態プロパティ
        isMuted,
        playerState,
        playbackRate: syncDataRef.current.playbackRate,
        volume,
        duration,
      }),
      [isMuted, playerState, volume, duration, updateSyncData]
    );

    return (
      <VJPlayer
        style={style}
        ref={vjPlayerRef}
        onStatusChange={handleStatusChange}
        syncKey={syncKey}
        videoId={videoId}
        autoLoop={autoLoop}
      />
    );
  }
);

VJPlayerForController.displayName = "VJPlayerForController";

export default VJPlayerForController;
