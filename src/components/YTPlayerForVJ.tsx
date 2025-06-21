import { forwardRef, useCallback, useRef } from "react";
import YouTubePlayer, { type YouTubePlayerRef, type PlayerStatus } from "./YouTubePlayer";

// YouTubePlayerRefを継承して、VJ用のプレイヤー参照型を定義
export interface YTPlayerForVJRef extends YouTubePlayerRef {}

interface YTPlayerForVJProps {
  onStatusChange?: (status: PlayerStatus) => void;
  autoLoop?: boolean; // VJ用: ループ機能のオン/オフ
}

const YTPlayerForVJ = forwardRef<YTPlayerForVJRef, YTPlayerForVJProps>(
  ({ onStatusChange, autoLoop = true }, ref) => {
    const youtubePlayerRef = useRef<YouTubePlayerRef>(null);

    const handleStatusChange = useCallback(
      (status: PlayerStatus) => {
        // VJ用: 動画が終了したら自動ループ（オプション有効時）
        if (autoLoop && status.playerState === 0 && youtubePlayerRef.current) {
          // 0 = YT.PlayerState.ENDED
          try {
            console.log("VJ Player: Video ended, looping...");
            youtubePlayerRef.current.seekTo(0, true);
            youtubePlayerRef.current.playVideo();
          } catch (error) {
            console.error("Error during VJ video loop:", error);
          }
        }

        // 親コンポーネントに状態変更を通知
        onStatusChange?.(status);
      },
      [autoLoop, onStatusChange]
    );

    return (
      <YouTubePlayer
        ref={(playerRef) => {
          // forwardRefで受け取ったrefと内部refの両方を設定
          youtubePlayerRef.current = playerRef;
          if (typeof ref === "function") {
            ref(playerRef);
          } else if (ref) {
            ref.current = playerRef;
          }
        }}
        onStatusChange={handleStatusChange}
      />
    );
  }
);

YTPlayerForVJ.displayName = "YTPlayerForVJ";

export default YTPlayerForVJ;
