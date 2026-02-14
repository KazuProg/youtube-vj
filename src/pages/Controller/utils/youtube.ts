import urlParserBase from "js-video-url-parser/lib/base";
import type { YouTubeVideoInfo } from "js-video-url-parser/lib/provider/youtube";
import type { VideoInfo } from "js-video-url-parser/lib/urlParser";

// Register only YouTube provider to reduce bundle size
import("js-video-url-parser/lib/provider/youtube").then((module) => {
  const YouTubeProvider = (module.default || module) as new () => {
    provider: string;
    parseVideoUrl: (url: string) => string | undefined;
    [key: string]: unknown;
  };
  const providerInstance = new YouTubeProvider();
  urlParserBase.bind(providerInstance as unknown as Parameters<typeof urlParserBase.bind>[0]);

  // Override parseVideoUrl to support YouTube Shorts format
  if (urlParserBase.plugins.youtube) {
    // @ts-expect-error - parseVideoUrl is not in the type definition but exists at runtime
    const originalParseVideoUrl = urlParserBase.plugins.youtube.parseVideoUrl;
    // @ts-expect-error - parseVideoUrl is not in the type definition but exists at runtime
    urlParserBase.plugins.youtube.parseVideoUrl = (url: string): string | undefined => {
      const shortsMatch = url.match(/youtube.com\/shorts\/([\w-]{11})/i);
      if (shortsMatch) {
        return shortsMatch[1];
      }
      return originalParseVideoUrl.call(urlParserBase.plugins.youtube, url);
    };
  }
});

const isYouTubeVideoId = (value: string): boolean => /^[A-Za-z0-9_-]{11}$/.test(value);

const isYouTubeVideoInfo = (info: VideoInfo | undefined): info is YouTubeVideoInfo => {
  return info !== undefined && info.provider === "youtube" && "id" in info;
};

export { isYouTubeVideoId, isYouTubeVideoInfo, urlParserBase as urlParser };
