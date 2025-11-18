import type { YouTubeVideoMetadata } from "@/types";

const parseStartTime = (tParam: string | null): number | undefined => {
  if (!tParam) {
    return undefined;
  }
  const parsedStart = Number.parseInt(tParam, 10);
  return Number.isNaN(parsedStart) ? undefined : parsedStart;
};

export const parseYouTubeURL = (str: string): YouTubeVideoMetadata | null => {
  if (isYouTubeID(str)) {
    return { id: str };
  }

  const urls = extractURLs(str);
  if (urls.length === 0) {
    return null;
  }

  let id: string | null = null;
  let start: number | undefined = undefined;

  for (const urlStr of urls) {
    const url = new URL(urlStr);
    const params = new URLSearchParams(url.search);

    if (url.hostname === "youtu.be") {
      id = url.pathname.substring(1, 12);
    }
    if (url.pathname === "/watch") {
      id = params.get("v");
    }
    if (url.pathname.startsWith("/shorts")) {
      id = url.pathname.substring(8, 19);
    }
    start = parseStartTime(params.get("t"));

    if (id) {
      break;
    }
  }

  if (!id) {
    return null;
  }

  return {
    id,
    start,
  } as YouTubeVideoMetadata;
};

export const isYouTubeID = (text: string) => {
  return /^([\w-]{11})$/.test(text);
};

export const extractURLs = (text: string) => {
  const urlPattern = /https?:\/\/[^\s/$.?#].[^\s]*/g;
  return text.match(urlPattern) || [];
};
