(() => {
  chrome.storage.onChanged.addListener((changes, _namespace) => {
    if (changes.videoId) {
      window.postMessage(
        {
          type: "YTVJ_EXTENSION_NOTIFY_VIDEO_ID",
          data: changes.videoId.newValue,
        },
        "https://youtube-vj.kazuprog.work/"
      );
    }
  });
})();
