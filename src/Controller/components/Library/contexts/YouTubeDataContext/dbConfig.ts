export const dbConfig = {
  databaseName: "YouTube-VJ",
  version: 1,
  stores: [
    {
      name: "YouTubeTitle",
      id: { keyPath: "videoId" },
      indices: [],
    },
  ],
};
