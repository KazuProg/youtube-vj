/**
 * YouTube Data API v3 を利用する汎用クライアント
 * @see https://developers.google.com/youtube/v3/docs
 */

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
