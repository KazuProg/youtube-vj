"use strict";

if (location.origin == "https://www.youtube.com") {
  /**
   * YouTube-VJ YouTube
   */
  let currentVideoId = null;

  const onYouTubeVideoChanged = (videoId) => {
    console.log(`YTVJ:E onYouTubeVideoChanged:${videoId}`);
    currentVideoId = videoId;
    chrome.storage.local.set({ videoId });
  };

  const onVideoLoadedToDeck = (loadedVideoId) => {
    console.log(`YTVJ:E onVideoLoadedToDeck:${loadedVideoId}`);
    if (loadedVideoId === currentVideoId) {
      document.querySelector("video").pause();
    }
  };

  // onYouTubeVideoChanged Dispatcher
  ((callback) => {
    let videoId = null;

    const checkVideoChange = () => {
      const params = new URLSearchParams(window.location.search);
      const currentVideoId = params.get("v");

      if (currentVideoId === null) {
        return;
      }

      if (currentVideoId !== videoId) {
        videoId = currentVideoId;
        callback(videoId);
      }
    };

    const titleObserver = new MutationObserver(() => {
      checkVideoChange();

      const playerElement = document.querySelector("div#movie_player");
      if (playerElement) {
        new MutationObserver(() => {
          checkVideoChange();
        }).observe(playerElement, {
          childList: true,
        });
        titleObserver.disconnect();
      }
    });
    titleObserver.observe(document.querySelector("title"), {
      childList: true,
    });

    checkVideoChange();
  })(onYouTubeVideoChanged);

  // onVideoLoadedToDeck Dispatcher
  ((callback) => {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (changes.loadedVideoId) {
        if (changes.loadedVideoId.newValue === null) {
          return;
        }
        callback(changes.loadedVideoId.newValue);
      }
    });
  })(onVideoLoadedToDeck);
} else {
  /**
   * YouTube-VJ Controller
   */
  chrome.storage.local.set({ loadedVideoId: null });

  const onYouTubeVideoChanged = (videoId) => {
    console.log(`YTVJ:E onYouTubeVideoChanged:${videoId}`);
    document.querySelector("#videoId").value = videoId;
  };

  const onVideoLoadedToDeck = (videoId) => {
    console.log(`YTVJ:E onVideoLoadedToDeck:${videoId}`);
    chrome.storage.local.set({ loadedVideoId: videoId });
  };

  // onYouTubeVideoChanged Dispatcher
  ((callback) => {
    const dispatch = () => {
      chrome.storage.local.get("videoId", (items) => {
        callback(items.videoId || "");
      });
    };

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (changes.videoId) {
        dispatch();
      }
    });

    dispatch();
  })(onYouTubeVideoChanged);

  // onVideoLoadedToDeck Dispatcher
  ((callback) => {
    const targetElement = document.querySelector("#loadedVideoId");

    new MutationObserver(() => {
      callback(targetElement.value);
    }).observe(targetElement, { attributes: true });
  })(onVideoLoadedToDeck);
}
