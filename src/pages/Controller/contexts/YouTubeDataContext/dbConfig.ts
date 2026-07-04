export const YOUTUBE_TITLE_STORE_NAME = "YouTubeTitle";

export const dbConfig = {
  databaseName: "YouTube-VJ",
  version: 1,
  stores: [
    {
      name: YOUTUBE_TITLE_STORE_NAME,
      id: { keyPath: "videoId" },
      indices: [],
    },
  ],
};
