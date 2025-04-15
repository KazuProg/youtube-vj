/**
 * ファイル操作のためのユーティリティクラス
 */
export default class FileHandler {
  /**
   * テキストファイルを読み込む
   * @param {File} file - 読み込むファイルオブジェクト
   * @returns {Promise<string>} テキスト内容を含むPromise
   */
  static readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * JSONファイルを読み込む
   * @param {File} file - 読み込むファイルオブジェクト
   * @returns {Promise<Object>} JSONオブジェクトを含むPromise
   */
  static readJSONFile(file) {
    return this.readTextFile(file)
      .then(text => JSON.parse(text));
  }

  /**
   * データをJSONファイルとしてダウンロードさせる
   * @param {Object} data - 保存するデータ
   * @param {string} filename - ファイル名
   */
  static saveJSONFile(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    
    this.downloadBlob(blob, filename);
  }

  /**
   * データをテキストファイルとしてダウンロードさせる
   * @param {string} text - 保存するテキスト
   * @param {string} filename - ファイル名
   */
  static saveTextFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    
    this.downloadBlob(blob, filename);
  }

  /**
   * Blobオブジェクトをダウンロードさせる
   * @param {Blob} blob - ダウンロードするBlobオブジェクト
   * @param {string} filename - ファイル名
   */
  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * ファイル選択ダイアログを開く
   * @param {string} accept - 受け入れるファイルタイプ（例: ".json,application/json"）
   * @param {boolean} multiple - 複数選択を許可するかどうか
   * @returns {Promise<FileList>} 選択されたファイルのリストを含むPromise
   */
  static openFileDialog(accept = '', multiple = false) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = multiple;
      input.style.display = 'none';
      
      input.onchange = (event) => {
        resolve(event.target.files);
        document.body.removeChild(input);
      };
      
      document.body.appendChild(input);
      input.click();
    });
  }
} 