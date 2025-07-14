import type { Options } from "youtube-player/dist/types";

export const LOCAL_STORAGE_KEY = {
  player: "ytvj_player",
};

export const YT_OPTIONS: Options = {
  width: "100%",
  height: "100%",
  playerVars: {
    autoplay: 1,
    controls: 0,
    disablekb: 1,
    // biome-ignore lint/style/useNamingConvention: YouTube API official parameter name
    iv_load_policy: 3,
  },
};
