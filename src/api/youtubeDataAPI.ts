/**
 * YouTube Data API v3 を利用する汎用クライアント
 * @see https://developers.google.com/youtube/v3/docs
 */

// =============================================================================
// Export types (Public API)
// =============================================================================

export type YouTubeVideoInfo = { id: string; title: string };

export interface YouTubePlaylistResult {
  playlistName: string;
  videos: YouTubeVideoInfo[];
}

// =============================================================================
// Internal types (API response)
// =============================================================================

interface YouTubeAPIError {
  code: number;
  message: string;
}

interface PlaylistsResponse {
  items?: Array<{
    snippet?: { title?: string };
  }>;
  error?: YouTubeAPIError;
}

interface PlaylistItemsResponse {
  items?: Array<{
    snippet?: {
      title?: string;
      resourceId?: { videoId?: string };
    };
  }>;
  nextPageToken?: string;
  error?: YouTubeAPIError;
}

interface SearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string };
  }>;
  error?: YouTubeAPIError;
}

// =============================================================================
// Helpers
// =============================================================================

async function apiFetch<T>(url: string, params: Record<string, string | undefined>): Promise<T> {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null)
  ) as Record<string, string>;
  const searchParams = new URLSearchParams(filtered);
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3${url}?${searchParams.toString()}`
  );
  return response.json();
}

function handleApiError(data: { error?: YouTubeAPIError }): boolean {
  if (data.error) {
    console.warn("[YouTube Data API]", data.error.message);
    return true;
  }
  return false;
}

function toVideoInfo(videoId: string | undefined, title: string | undefined): YouTubeVideoInfo[] {
  return videoId && title ? [{ id: videoId, title }] : [];
}

// =============================================================================
// Public API
// =============================================================================

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

  const playlistsData = await apiFetch<PlaylistsResponse>("/playlists", {
    key: apiKey,
    part: "snippet",
    fields: "items(snippet(title))",
    id: playlistId,
  });
  if (handleApiError(playlistsData)) {
    return null;
  }

  const playlistName = playlistsData.items?.[0]?.snippet?.title ?? "";

  const playlistItemsParams = {
    key: apiKey,
    part: "snippet",
    fields: "items(snippet(title,resourceId(videoId))),nextPageToken,pageInfo",
    playlistId,
    maxResults: "50",
  };

  const videos: YouTubeVideoInfo[] = [];
  let pageToken: string | null = null;

  do {
    const data: PlaylistItemsResponse = await apiFetch("/playlistItems", {
      ...playlistItemsParams,
      pageToken: pageToken ?? undefined,
    });
    if (handleApiError(data)) {
      return null;
    }

    videos.push(
      ...(data.items ?? []).flatMap((item) =>
        toVideoInfo(item.snippet?.resourceId?.videoId, item.snippet?.title)
      )
    );

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
): Promise<YouTubeVideoInfo[]> {
  if (!apiKey.trim()) {
    return [];
  }

  const data = await apiFetch<SearchResponse>("/search", {
    key: apiKey,
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
  });
  if (handleApiError(data)) {
    return [];
  }

  return (data.items ?? []).flatMap((item) => toVideoInfo(item.id?.videoId, item.snippet?.title));
}
