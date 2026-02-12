/**
 * YouTube Data API v3 を利用する汎用クライアント
 * @see https://developers.google.com/youtube/v3/docs
 */

interface YouTubePlaylistResponse {
  items?: Array<{
    snippet?: {
      title?: string;
      resourceId?: { videoId?: string };
    };
  }>;
  nextPageToken?: string;
  error?: {
    code: number;
    message: string;
  };
}

interface YouTubePlaylistsListResponse {
  items?: Array<{
    snippet?: { title?: string };
  }>;
  error?: {
    code: number;
    message: string;
  };
}

export interface YouTubePlaylistResult {
  playlistName: string;
  videos: { id: string; title: string }[];
}

interface YouTubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string };
  }>;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * YouTube Data API を使用してプレイリスト内の動画一覧を取得する
 *
 * @param apiKey - YouTube Data API キー
 * @param playlistId - プレイリストID
 * @returns プレイリスト名と動画配列。APIキーが空またはエラー時は null を返す
 */
export async function fetchYouTubePlaylist(
  apiKey: string,
  playlistId: string
): Promise<YouTubePlaylistResult | null> {
  if (!apiKey.trim()) {
    return null;
  }

  let playlistName = "";
  const playlistsParams = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    fields: "items(snippet(title))",
    id: playlistId,
  });
  const playlistsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?${playlistsParams.toString()}`
  );
  const playlistsData: YouTubePlaylistsListResponse = await playlistsResponse.json();
  if (!playlistsData.error && playlistsData.items?.[0]?.snippet?.title) {
    playlistName = playlistsData.items[0].snippet.title;
  }

  const maxResults = 50;
  const videos: { id: string; title: string }[] = [];
  let pageToken: string | null = null;

  do {
    const params = new URLSearchParams({
      key: apiKey,
      part: "snippet",
      fields: "items(snippet(title,resourceId(videoId))),nextPageToken,pageInfo",
      playlistId,
      maxResults: String(maxResults),
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
    );
    const data: YouTubePlaylistResponse = await response.json();
    if (data.error) {
      console.warn("[YouTube Data API]", data.error.message);
      return null;
    }

    const items = data.items ?? [];
    const pageVideos = items
      .filter(
        (item): item is { snippet: { resourceId: { videoId: string }; title: string } } =>
          !!item.snippet?.resourceId?.videoId && !!item.snippet?.title
      )
      .map((item) => ({ id: item.snippet.resourceId.videoId, title: item.snippet.title }));
    videos.push(...pageVideos);

    // MixListの場合はページングを無視する
    pageToken = playlistId.startsWith("RD") ? null : (data.nextPageToken ?? null);
  } while (pageToken);

  return { playlistName, videos };
}

/**
 * YouTube Data API を使用して動画を検索する
 *
 * @param apiKey - YouTube Data API キー
 * @param query - 検索クエリ
 * @param maxResults - 取得する最大件数（デフォルト: 50）
 * @returns 検索結果の動画配列。APIキーが空またはエラー時は空配列を返す
 */
export async function searchYouTubeVideos(
  apiKey: string,
  query: string,
  maxResults = 50
): Promise<{ id: string; title: string }[]> {
  if (!apiKey.trim()) {
    return [];
  }

  const params = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  const data: YouTubeSearchResponse = await response.json();

  if (data.error) {
    console.warn("[YouTube Data API]", data.error.message);
    return [];
  }

  const items = data.items ?? [];
  return items
    .filter(
      (item): item is { id: { videoId: string }; snippet: { title: string } } =>
        !!item.id?.videoId && !!item.snippet?.title
    )
    .map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
    }));
}
