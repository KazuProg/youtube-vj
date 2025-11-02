export const loadYouTubeIFrameAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    if (window.onYouTubeIframeAPIReady) {
      const originalCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        originalCallback();
        resolve();
      };
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      reject(new Error("Failed to load YouTube iFrame API"));
    };

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };

    document.head.appendChild(script);
  });
};
