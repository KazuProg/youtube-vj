"use strict";

class _Library {
  actions;
  onVisibilityChanged;
  #playlist;
  #videolist;
  #focusedlist;

  #UIElements;

  constructor() {
    this.actions = {
      up: this.#up.bind(this),
      down: this.#down.bind(this),
      changeFocus: this.#changeFocus.bind(this),
    };
  }

  init() {
    const root = document.querySelector("#library");
    this.#UIElements = {
      library: root,
      playlist: root.querySelector(".playlist"),
      videolist: root.querySelector(".videolist"),
      searchInput: root.querySelector("#search-keyword"),
      videoFocused: null,
      focusedListParent: null,
    };

    new FileDrop(root, this.#onFileDrop.bind(this));

    this.#playlist = new _Library_Playlist(
      this.#UIElements.playlist,
      this.#onPlaylistChanged.bind(this)
    );
    this.#videolist = new _Library_Videolist(
      this.#UIElements.videolist,
      this.#onVideoSelected.bind(this),
      this.#onVideoListChanged.bind(this)
    );

    if (Config.youtubeAPIKey) {
      this.#playlist.insert("Search", []);

      let searchInputTimeout = null;
      this.#UIElements.searchInput.addEventListener("keydown", (e) => {
        if (searchInputTimeout) {
          clearTimeout(searchInputTimeout);
        }

        const keyword = this.#UIElements.searchInput.value;
        if (keyword.length === "") return;

        if (e.key === "Enter") {
          this.#searchYouTubeVideos(keyword);
          search(keyword);
        } else {
          searchInputTimeout = setTimeout(() => {
            this.#searchYouTubeVideos(keyword);
          }, 500);
        }
      });
    }
  }

  #searchYouTubeVideos(keyword) {
    const apiKey = Config.youtubeAPIKey;
    const apiRequests = Config.youtubeAPIRequests;
    if (!apiKey) {
      console.error("YouTube API key is not set.");
      return;
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      keyword
    )}&key=${apiKey}&maxResults=${apiRequests}`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        videos = data.items;
        const videoIds = videos.map((video) => video.id.videoId);
        videos.forEach((video) => {
          YouTubeTitleFetcher.addManually(
            video.id.videoId,
            video.snippet.title
          );
        });
        this.#playlist.insert("Search", videoIds);
      })
      .catch((error) => {
        console.error("Error fetching YouTube videos:", error);
      });
  }

  #onFileDrop(files) {
    for (const file of files) {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.#loadList(file.name, e.target.result);
        };
        reader.readAsText(file);
      }
    }
  }

  loadListFile() {
    FileHandler.readText().then((result) => {
      this.#loadList(result.file.name, result.content);
    });
  }

  #loadList(filename, content) {
    function getFileNameWithoutExtension(filename) {
      return filename.substring(0, filename.lastIndexOf(".")) || filename;
    }

    const name = getFileNameWithoutExtension(filename);
    const list = content
      .split(/\r\n|\r|\n/)
      .map((text) => {
        text = text.trim();
        if (!text) return null;
        if (text.startsWith(";")) return null;

        const parsed = parseYouTubeURL(text);
        if (parsed) {
          let result = parsed.id;
          if (parsed.start) result = `${result}@${parsed.start}`;
          return result;
        } else {
          return text;
        }
      })
      .filter((a) => a);
    this.#playlist.insert(name, list);
  }

  get isVisible() {
    return !this.#UIElements.library.classList.contains("hidden");
  }

  show() {
    this.#focusList(this.#UIElements.videolist);
    this.#updateHistory();
    this.#UIElements.library.classList.remove("hidden");
    if (typeof this.onVisibilityChanged === "function") {
      this.onVisibilityChanged(true);
    }
  }

  #onPlaylistChanged(name, list) {
    this.#videolist.update(list);
    if (name === "Search") {
      this.#UIElements.searchInput.classList.remove("hidden");
    } else {
      this.#UIElements.searchInput.classList.add("hidden");
    }
  }

  #onVideoSelected(videoId) {
    changeVideo(videoId);
  }

  #onVideoListChanged(videoIds) {
    History.replaceAll(videoIds);
  }

  hide() {
    this.#UIElements.library.classList.add("hidden");
    if (typeof this.onVisibilityChanged === "function") {
      this.onVisibilityChanged(false);
    }
  }

  #up() {
    this.#focusedlist.actions.up();
  }

  #down() {
    this.#focusedlist.actions.down();
  }

  #changeFocus() {
    if (this.#UIElements.playlist.classList.contains("focused")) {
      this.#focusList(this.#UIElements.videolist);
    } else {
      this.#focusList(this.#UIElements.playlist);
    }
  }

  #focusList(element) {
    this.#UIElements.playlist.classList.remove("focused");
    this.#UIElements.videolist.classList.remove("focused");

    element.classList.add("focused");
    if (element === this.#UIElements.playlist) {
      this.#UIElements.focusedListParent = this.#UIElements.playlistContainer;
      this.#focusedlist = this.#playlist;
    } else {
      this.#UIElements.focusedListParent = this.#UIElements.videoTBody;
      this.#focusedlist = this.#videolist;
    }
  }

  addHistory(videoId) {
    History.add(videoId);
    this.#updateHistory();
  }

  #updateHistory() {
    const idx = this.#videolist.selectedIndex;
    const history = History.getAll();
    this.#playlist.insert("History", history);

    // リスト更新時に先頭の動画が選択されてしまう対策
    // 履歴の最後(=選択中だった動画)を選択させる
    this.#onVideoSelected(history.at(-1));

    // もともと選択されていた動画を選択
    if (idx !== -1) {
      this.#videolist.selectByIndex(idx, false);
    }
  }
}

class _Library_Playlist {
  #UIElems;
  #onChangedCallback;
  actions;
  #currentName;

  constructor(parentElement, onChangedCallback) {
    this.#UIElems = {
      parent: parentElement,
      ul: parentElement.querySelector("ul"),
    };
    this.#onChangedCallback = onChangedCallback;
    this.actions = {
      up: this.#up.bind(this),
      down: this.#down.bind(this),
    };
  }

  #up() {
    const prev =
      this.#UIElems.ul.querySelector(".focused").previousElementSibling ||
      this.#UIElems.ul.lastElementChild;
    this.#handleSelectionChange(prev);
  }

  #down() {
    const next =
      this.#UIElems.ul.querySelector(".focused").nextElementSibling ||
      this.#UIElems.ul.firstElementChild;
    this.#handleSelectionChange(next);
  }

  #handleSelectionChange(element) {
    const focused = this.#UIElems.ul.querySelector(".focused");
    if (focused) {
      focused.classList.remove("focused");
    }

    element.classList.add("focused");
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
    this.#currentName = element.getAttribute("list-name");

    this.#onChangedCallback(
      this.#currentName,
      JSON.parse(element.getAttribute("list"))
    );
  }

  insert(name, list) {
    const playlists = this.#UIElems.ul.children;
    for (const playlist of playlists) {
      if (playlist.getAttribute("list-name") == name) {
        playlist.setAttribute("list", JSON.stringify(list));
        if (name === this.#currentName) {
          //リスト更新通知
          this.#handleSelectionChange(playlist);
        }
        return;
      }
    }

    const li = document.createElement("li");
    li.innerText = name;
    li.setAttribute("list-name", name);
    li.setAttribute("list", JSON.stringify(list));
    li.addEventListener("click", () => {
      this.#handleSelectionChange(li);
    });
    this.#UIElems.ul.appendChild(li);

    this.#handleSelectionChange(li);
  }
}

class _Library_Videolist {
  #UIElems;
  #onSelected;
  #onChanged;
  actions;

  constructor(parentElement, onSelectedCallback, onChangedCallback) {
    this.#UIElems = {
      parent: parentElement,
      tbody: parentElement.querySelector("tbody"),
    };
    this.#onSelected = onSelectedCallback;
    this.#onChanged = onChangedCallback;
    this.actions = {
      up: this.#up.bind(this),
      down: this.#down.bind(this),
    };
  }

  #up() {
    const prev =
      this.#UIElems.tbody.querySelector(".focused").previousElementSibling ||
      this.#UIElems.tbody.lastElementChild;
    this.#select(prev);
  }

  #down() {
    const next =
      this.#UIElems.tbody.querySelector(".focused").nextElementSibling ||
      this.#UIElems.tbody.firstElementChild;
    this.#select(next);
  }

  #select(element, notify = true) {
    const focused = this.#UIElems.tbody.querySelector(".focused");
    if (focused) {
      focused.classList.remove("focused");
    }

    element.classList.add("focused");
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    if (notify) {
      this.#onSelected(element.getAttribute("youtube-id"));
    }
  }

  #remove(element) {
    if (confirm("削除してもよろしいですか？")) {
      if (element.classList.contains("focused")) {
        const next =
          element.nextElementSibling || element.previousElementSibling;
        this.#select(next);
      }
      element.remove();

      const videoList = [...this.#UIElems.tbody.children].map((tr) =>
        tr.getAttribute("youtube-id")
      );
      if (this.#onChanged) {
        this.#onChanged(videoList);
      }
    }
  }

  get selectedIndex() {
    const focused = this.#UIElems.tbody.querySelector(".focused");
    if (!focused) {
      return -1;
    }
    let element = focused;
    let index = 0;
    while (element.previousElementSibling) {
      element = element.previousElementSibling;
      index++;
    }
    return index;
  }

  selectByIndex(index, notify = true) {
    const target = this.#UIElems.tbody.children[index];
    this.#select(target, notify);
  }

  update(videoIds) {
    this.#UIElems.tbody.innerHTML = "";
    for (const id of videoIds) {
      this.append(id);
    }
    const trs = this.#UIElems.tbody.children;
    if (trs.length !== 0) {
      this.#select(trs[0]);
    }
  }

  append(videoIdWithTime) {
    //以前は{videoId, videoTitle}のオブジェクトだったため
    if (typeof videoIdWithTime !== "string") return;

    const videoId = videoIdWithTime.substr(0, 11);
    const tr = document.createElement("tr");
    tr.setAttribute("youtube-id", videoIdWithTime);
    tr.innerHTML =
      `<td><img src="https://img.youtube.com/vi/${videoId}/default.jpg"></td>` +
      `<td>Loading title...</td>`;
    tr.addEventListener("click", () => {
      this.#select(tr);
    });
    tr.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.#remove(tr);
    });
    YouTubeTitleFetcher.fetch(videoId).then((title) => {
      tr.querySelectorAll("td")[1].innerText = title;
    });
    this.#UIElems.tbody.appendChild(tr);
  }
}

const Library = new _Library();
