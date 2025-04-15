import EventEmitter from './EventEmitter.js';

/**
 * ファイルのドラッグアンドドロップを管理するクラス
 */
export default class FileDrop extends EventEmitter {
  /**
   * @param {HTMLElement} element - ドロップターゲットのDOM要素
   * @param {Object} options - オプション
   * @param {Array<string>} options.acceptedTypes - 受け入れるMIMEタイプの配列
   * @param {HTMLElement} options.dragOverlay - ドラッグオーバー時に表示するオーバーレイ要素
   */
  constructor(element, options = {}) {
    super();
    
    this.element = element;
    this.options = {
      acceptedTypes: [],
      dragOverlay: null,
      ...options
    };
    
    this.bindEvents();
  }

  /**
   * イベントをバインドする
   */
  bindEvents() {
    this.element.addEventListener('dragover', this.handleDragOver.bind(this));
    this.element.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.element.addEventListener('drop', this.handleDrop.bind(this));
  }

  /**
   * ドラッグオーバーイベントのハンドラ
   * @param {DragEvent} event - ドラッグイベント
   */
  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.element.classList.add('dragover');
    
    if (this.options.dragOverlay) {
      this.options.dragOverlay.style.display = 'flex';
    }
    
    this.dispatchEvent('dragover', event);
  }

  /**
   * ドラッグリーブイベントのハンドラ
   * @param {DragEvent} event - ドラッグイベント
   */
  handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.element.classList.remove('dragover');
    
    if (this.options.dragOverlay) {
      this.options.dragOverlay.style.display = 'none';
    }
    
    this.dispatchEvent('dragleave', event);
  }

  /**
   * ドロップイベントのハンドラ
   * @param {DragEvent} event - ドラッグイベント
   */
  handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.element.classList.remove('dragover');
    
    if (this.options.dragOverlay) {
      this.options.dragOverlay.style.display = 'none';
    }
    
    const files = Array.from(event.dataTransfer.files);
    
    // MIMEタイプによるフィルタリング
    let validFiles = files;
    if (this.options.acceptedTypes.length > 0) {
      validFiles = files.filter(file => {
        return this.options.acceptedTypes.some(type => {
          if (type.includes('*')) {
            const typePrefix = type.split('*')[0];
            return file.type.startsWith(typePrefix);
          }
          return file.type === type;
        });
      });
    }
    
    this.dispatchEvent('drop', validFiles, event);
    
    if (validFiles.length !== files.length) {
      this.dispatchEvent('invalidfiledrop', 
        files.filter(file => !validFiles.includes(file)), 
        event
      );
    }
  }

  /**
   * 要素のイベントリスナーをすべて削除
   */
  destroy() {
    this.element.removeEventListener('dragover', this.handleDragOver);
    this.element.removeEventListener('dragleave', this.handleDragLeave);
    this.element.removeEventListener('drop', this.handleDrop);
    this.removeAllListeners();
  }
} 