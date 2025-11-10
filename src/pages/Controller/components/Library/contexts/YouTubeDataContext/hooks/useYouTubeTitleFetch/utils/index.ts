import type { ExtendedYTPlayer } from "./types";

function fetchYouTubeTitle(id: string): Promise<string> {
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

export default fetchYouTubeTitle;
