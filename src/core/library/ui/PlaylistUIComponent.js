/**
 * プレイリストUIコンポーネント
 * プレイリストの表示と操作を担当
 */
export class PlaylistUIComponent {
  #UIElems;
  #onChangedCallback;
  #currentName;

  constructor(parentElement, onChangedCallback) {
    this.#UIElems = {
      parent: parentElement,
      ul: parentElement.querySelector("ul"),
    };
    this.#onChangedCallback = onChangedCallback;
  }

  /**
   * 上方向のナビゲーション
   */
  navigateUp() {
    const prev =
      this.#UIElems.ul.querySelector(".focused").previousElementSibling ||
      this.#UIElems.ul.lastElementChild;
    this.#handleSelectionChange(prev);
  }

  /**
   * 下方向のナビゲーション
   */
  navigateDown() {
    const next =
      this.#UIElems.ul.querySelector(".focused").nextElementSibling ||
      this.#UIElems.ul.firstElementChild;
    this.#handleSelectionChange(next);
  }

  /**
   * プレイリストを追加または更新
   * @param {string} name - プレイリスト名
   * @param {string[]} list - ビデオIDの配列
   */
  insertPlaylist(name, list) {
    const playlists = this.#UIElems.ul.children;
    for (const playlist of playlists) {
      if (playlist.getAttribute("list-name") == name) {
        playlist.setAttribute("list", JSON.stringify(list));
        if (name === this.#currentName) {
          // リスト更新通知
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

  /**
   * 現在選択されているプレイリスト名を取得
   * @returns {string} - プレイリスト名
   */
  getCurrentPlaylistName() {
    return this.#currentName;
  }

  /**
   * フォーカス状態を設定
   * @param {boolean} focused - フォーカス状態
   */
  setFocused(focused) {
    if (focused) {
      this.#UIElems.parent.classList.add("focused");
    } else {
      this.#UIElems.parent.classList.remove("focused");
    }
  }

  /**
   * 選択変更を処理
   * @param {HTMLElement} element - 選択された要素
   */
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

    const videoIds = JSON.parse(element.getAttribute("list"));
    this.#onChangedCallback(this.#currentName, videoIds);
  }
}
