/**
 * ビデオリストUIコンポーネント
 * ビデオリストの表示と操作を担当
 */
export class VideoListUIComponent {
  #UIElems;
  #onSelected;
  #onChanged;
  #titleFetcher;

  constructor(
    parentElement,
    onSelectedCallback,
    onChangedCallback,
    titleFetcher
  ) {
    this.#UIElems = {
      parent: parentElement,
      tbody: parentElement.querySelector("tbody"),
    };
    this.#onSelected = onSelectedCallback;
    this.#onChanged = onChangedCallback;
    this.#titleFetcher = titleFetcher;
  }

  /**
   * 上方向のナビゲーション
   */
  navigateUp() {
    const prev =
      this.#UIElems.tbody.querySelector(".focused").previousElementSibling ||
      this.#UIElems.tbody.lastElementChild;
    this.#select(prev);
  }

  /**
   * 下方向のナビゲーション
   */
  navigateDown() {
    const next =
      this.#UIElems.tbody.querySelector(".focused").nextElementSibling ||
      this.#UIElems.tbody.firstElementChild;
    this.#select(next);
  }

  /**
   * ビデオリストを更新
   * @param {string[]} videoIds - ビデオIDの配列
   */
  updateVideoList(videoIds) {
    this.#UIElems.tbody.innerHTML = "";
    for (const id of videoIds) {
      this.#appendVideo(id);
    }
    const trs = this.#UIElems.tbody.children;
    if (trs.length !== 0) {
      this.#select(trs[0]);
    }
  }

  /**
   * 現在選択されているビデオのインデックスを取得
   * @returns {number} - 選択されているインデックス
   */
  getSelectedIndex() {
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

  /**
   * インデックスでビデオを選択
   * @param {number} index - インデックス
   * @param {boolean} notify - 通知するかどうか
   */
  selectByIndex(index, notify = true) {
    const target = this.#UIElems.tbody.children[index];
    if (target) {
      this.#select(target, notify);
    }
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
   * ビデオを選択
   * @param {HTMLElement} element - 選択する要素
   * @param {boolean} notify - 通知するかどうか
   */
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

  /**
   * ビデオを削除
   * @param {HTMLElement} element - 削除する要素
   */
  #remove(element) {
    if (confirm("削除してもよろしいですか？")) {
      if (element.classList.contains("focused")) {
        const next =
          element.nextElementSibling || element.previousElementSibling;
        if (next) {
          this.#select(next);
        }
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

  /**
   * ビデオを追加
   * @param {string} videoIdWithTime - ビデオID（時間付き）
   */
  #appendVideo(videoIdWithTime) {
    // 以前は{videoId, videoTitle}のオブジェクトだったため
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
    this.#titleFetcher.fetch(videoId).then((title) => {
      tr.querySelectorAll("td")[1].innerText = title;
    });
    this.#UIElems.tbody.appendChild(tr);
  }
}
