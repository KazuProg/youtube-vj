"use strict";

class _Library {
  actions;
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
      this.#onVideoSelected.bind(this)
    );
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
  }

  #onPlaylistChanged(list) {
    this.#videolist.update(list);
  }

  #onVideoSelected(videoId) {
    changeVideo(videoId);
  }

  hide() {
    this.#UIElements.library.classList.add("hidden");
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
    HistoryManager.add(videoId);
    this.#updateHistory();
  }

  #updateHistory() {
    const idx = this.#videolist.selectedIndex;
    this.#playlist.insert("History", HistoryManager.getAll());
    // リスト更新時にライブラリの選択中動画が先頭に戻ってしまう対策
    if (idx !== -1) {
      this.#videolist.selectByIndex(idx);
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

    this.#onChangedCallback(JSON.parse(element.getAttribute("list")));
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
  actions;

  constructor(parentElement, onSelectedCallback) {
    this.#UIElems = {
      parent: parentElement,
      tbody: parentElement.querySelector("tbody"),
    };
    this.#onSelected = onSelectedCallback;
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

  #select(element) {
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

    this.#onSelected(element.getAttribute("youtube-id"));
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

  selectByIndex(index) {
    const target = this.#UIElems.tbody.children[index];
    this.#select(target);
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
    YouTubeTitleFetcher.fetch(videoId).then((title) => {
      tr.querySelectorAll("td")[1].innerText = title;
    });
    this.#UIElems.tbody.appendChild(tr);
  }
}

const Library = new _Library();
