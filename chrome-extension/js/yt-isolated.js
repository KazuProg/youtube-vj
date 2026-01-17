(() => {
  const handleYouTubeVideoChanged = () => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get("v");

    if (videoId === null) {
      return;
    }

    chrome.storage.local.set({ videoId });
  };

  const titleObserver = new MutationObserver(() => {
    handleYouTubeVideoChanged();

    const playerElement = document.querySelector("div#movie_player");
    if (playerElement) {
      new MutationObserver(() => {
        handleYouTubeVideoChanged();
      }).observe(playerElement, {
        childList: true,
      });
      titleObserver.disconnect();
    }
  });
  const titleElement = document.querySelector("title");
  if (titleElement) {
    titleObserver.observe(titleElement, {
      childList: true,
    });
  }

  handleYouTubeVideoChanged();
})();
