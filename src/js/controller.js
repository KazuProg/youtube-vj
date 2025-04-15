import YoutubeTitleFetcher from './utils/YoutubeTitleFetcher.js';
import FileDrop from './utils/FileDrop.js';
import FileHandler from './utils/FileHandler.js';
import Storage from './utils/Storage.js';

// グローバル変数
let selectedChannel = null;
let videoId = '';
let channels = [];
let youtubeTitleFetcher = new YoutubeTitleFetcher();

/**
 * UIの初期化
 * @param {Array} channelInstances - VJPlayerのインスタンス配列
 */
export function initializeUI(channelInstances) {
  channels = channelInstances;
  
  // シークバーのアニメーション
  setInterval(updateSeekbar, 50);
  
  // ライブラリモジュールの初期化
  initializeLibrary();
  
  // 設定の初期化
  initializeConfig();
  
  // MIDIの初期化
  initializeMIDI();
}

/**
 * イベントリスナーの初期化
 */
export function initializeEventListeners() {
  // チャンネル選択のイベント委任
  document.querySelectorAll('.deck').forEach(deck => {
    deck.addEventListener('click', () => {
      const channelNumber = parseInt(deck.dataset.channel);
      selectChannel(channelNumber);
    });
  });
  
  // 調整ボタンのイベント委任
  document.addEventListener('click', (event) => {
    if (event.target.hasAttribute('data-adjust')) {
      const adjustment = parseFloat(event.target.dataset.adjust);
      const deckElement = event.target.closest('.deck');
      
      if (deckElement) {
        const channelNumber = parseInt(deckElement.dataset.channel);
        adjustTiming(channelNumber, adjustment);
      }
    }
    
    // スピードリセット
    if (event.target.hasAttribute('data-action') && event.target.dataset.action === 'reset-speed') {
      const deckElement = event.target.closest('.deck');
      
      if (deckElement) {
        const channelNumber = parseInt(deckElement.dataset.channel);
        setSpeed(channelNumber, 1);
      }
    }
    
    // プレビュー一時停止
    if (event.target.hasAttribute('data-action') && event.target.dataset.action === 'suspend-preview') {
      const deckElement = event.target.closest('.deck');
      
      if (deckElement) {
        const channelNumber = parseInt(deckElement.dataset.channel);
        suspendPreview(channelNumber);
      }
    }
    
    // ロード操作
    if (event.target.hasAttribute('data-action')) {
      const action = event.target.dataset.action;
      
      if (action === 'load-to-ch0') {
        loadToChannel(0);
      } else if (action === 'load-to-ch1') {
        loadToChannel(1);
      } else if (action === 'open-youtube') {
        openYouTubeWindow();
      } else if (action === 'switch-video') {
        switchVideo();
      } else if (action === 'set-switch-duration' && event.type === 'contextmenu') {
        event.preventDefault();
        setSwitchingDuration();
        return false;
      }
    }
  });
  
  // シークバークリック
  document.querySelectorAll('.seek-bar').forEach(seekBar => {
    seekBar.addEventListener('click', (event) => {
      if (Storage.load('config-seek-click', true)) {
        const deckElement = event.target.closest('.deck');
        
        if (deckElement) {
          const channelNumber = parseInt(deckElement.dataset.channel);
          const ratio = getRatio(seekBar, event);
          seekToPosition(channelNumber, ratio);
        }
      }
    });
  });
  
  // フェーダー類のコントロール
  document.addEventListener('input', (event) => {
    if (event.target.hasAttribute('data-control')) {
      const control = event.target.dataset.control;
      const value = parseFloat(event.target.value);
      
      if (control === 'speed') {
        const deckElement = event.target.closest('.deck');
        if (deckElement) {
          const channelNumber = parseInt(deckElement.dataset.channel);
          setSpeed(channelNumber, value);
        }
      } else if (control === 'opacity') {
        const channelNumber = parseInt(event.target.dataset.channel);
        setFilter(channelNumber, { opacity: value });
      } else if (control === 'crossfader') {
        setCrossfader(value);
      }
    }
  });
  
  // ビデオID入力
  document.getElementById('input-videoId').addEventListener('input', (event) => {
    changeVideo(event.target.value);
  });
  
  // キーボードショートカット
  document.addEventListener('keydown', (event) => {
    // Ctrlキー系のショートカット
    if (event.ctrlKey) {
      if (event.key === 'p') {
        openProjectionWindow();
        event.preventDefault();
        return;
      }
      if (event.key === '1') {
        selectChannel(0);
        event.preventDefault();
        return;
      }
      if (event.key === '2') {
        selectChannel(1);
        event.preventDefault();
        return;
      }
      if (event.key === 'm') {
        toggleMIDIEditor();
        event.preventDefault();
        return;
      }
    }
    
    // ライブラリ操作
    if (event.key === 'Tab') {
      toggleLibraryFocus();
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowUp') {
      libraryNavigateUp();
      return;
    }
    if (event.key === 'ArrowDown') {
      libraryNavigateDown();
      return;
    }
    
    // 入力中は以降のショートカットを無効化
    const activeElement = document.activeElement;
    if (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    ) {
      return;
    }
    
    // その他のショートカット
    if (event.key === 'Escape') {
      selectChannel(null);
      event.preventDefault();
      return;
    }
    if (event.key === '/') {
      document.getElementById('input-videoId').focus();
      selectChannel(null);
      event.preventDefault();
      return;
    }
    if (event.key === 's') {
      switchVideo();
      event.preventDefault();
      return;
    }
  });
  
  // ステータスバーのクリック
  document.getElementById('library-status').addEventListener('click', toggleLibrary);
  document.getElementById('show-config-editor').addEventListener('click', toggleConfig);
  document.getElementById('config-close').addEventListener('click', toggleConfig);
  document.getElementById('midi-device-status').addEventListener('click', () => {
    requestMIDIAccess();
  });
  document.getElementById('projection-status').addEventListener('click', () => {
    openProjectionWindow();
  });
  
  // タブが閉じられる前に確認
  window.addEventListener('beforeunload', (event) => {
    if (Storage.load('config-exit-confirmation', true)) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

/**
 * チャンネルを選択する
 * @param {number|null} channelNumber - チャンネル番号（nullで選択解除）
 */
export function selectChannel(channelNumber) {
  document.querySelectorAll('.deck').forEach(deck => {
    deck.classList.remove('selected');
  });
  
  if (channelNumber !== null) {
    document.querySelector(`.deck[data-channel="${channelNumber}"]`).classList.add('selected');
  }
  
  selectedChannel = channelNumber;
}

/**
 * ビデオIDを変更する
 * @param {string} text - ビデオIDまたはURL
 */
export function changeVideo(text) {
  if (!text) {
    document.getElementById('videoId').value = '';
    document.querySelector('.yt-thumbnail').src = '';
    return;
  }

  let id = text;
  
  // URLの場合は抽出
  if (isURL(text)) {
    id = parseYouTubeURL(text);
  }
  
  if (id) {
    document.getElementById('videoId').value = id;
    document.querySelector('.yt-thumbnail').src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
    videoId = id;
    
    // タイトル取得
    youtubeTitleFetcher.fetchTitle(id).then(title => {
      document.querySelector('.yt-thumbnail').setAttribute('title', title);
    });
  }
}

/**
 * 指定チャンネルにビデオをロード
 * @param {number} channelNumber - チャンネル番号
 */
export function loadToChannel(channelNumber) {
  if (!videoId) return;
  
  channels[channelNumber].setVideo(videoId);
}

/**
 * ビデオを切り替え
 */
export function switchVideo() {
  const crossfader = document.getElementById('cross-fader');
  const currentValue = parseFloat(crossfader.value);
  
  let targetValue;
  if (currentValue < 0) {
    targetValue = 1;
  } else {
    targetValue = -1;
  }
  
  const duration = Storage.load('config-switching-duration', 0.3) * 1000;
  
  // アニメーション
  const startTime = performance.now();
  const startValue = currentValue;
  
  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const value = startValue + (targetValue - startValue) * progress;
    crossfader.value = value;
    setCrossfader(value);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

/**
 * クロスフェーダーの値を設定
 * @param {number} value - クロスフェーダーの値
 */
export function setCrossfader(value) {
  const opacity0 = value <= 0 ? 1 : Math.max(0, 1 - Math.abs(value));
  const opacity1 = value >= 0 ? 1 : Math.max(0, 1 - Math.abs(value));
  
  setFilter(0, { opacity: opacity0 });
  setFilter(1, { opacity: opacity1 });
  
  document.querySelector('.opacity .deck0').value = opacity0;
  document.querySelector('.opacity .deck1').value = opacity1;
}

/**
 * フィルターを設定
 * @param {number} channelNumber - チャンネル番号
 * @param {Object} filterObj - フィルター設定
 */
export function setFilter(channelNumber, filterObj) {
  channels[channelNumber].setFilter(filterObj);
}

/**
 * 再生速度を設定
 * @param {number} channelNumber - チャンネル番号
 * @param {number} speed - 再生速度
 */
export function setSpeed(channelNumber, speed) {
  channels[channelNumber].setSpeed(speed);
  
  // UI更新
  const deck = document.querySelector(`.deck.ch${channelNumber}`);
  deck.querySelector('.speed input[type=range]').value = speed;
  deck.querySelector('.speed input[type=number]').value = speed.toFixed(2);
}

/**
 * 再生位置を調整
 * @param {number} channelNumber - チャンネル番号
 * @param {number} seconds - 調整秒数（正負）
 */
export function adjustTiming(channelNumber, seconds) {
  const currentTime = channels[channelNumber].currentTime;
  channels[channelNumber].seekTo(currentTime + seconds);
}

/**
 * プレビューを一時停止/再開
 * @param {number} channelNumber - チャンネル番号
 */
export function suspendPreview(channelNumber) {
  const overlay = document.querySelector(`.deck.ch${channelNumber} .suspend`);
  
  if (overlay.classList.contains('hidden')) {
    overlay.classList.remove('hidden');
    channels[channelNumber].dispatchEvent('suspendPreview', channelNumber);
  } else {
    overlay.classList.add('hidden');
    channels[channelNumber].dispatchEvent('resumePreview', channelNumber);
  }
}

/**
 * 特定位置にシーク
 * @param {number} channelNumber - チャンネル番号
 * @param {number} ratio - 位置の割合（0-1）
 */
export function seekToPosition(channelNumber, ratio) {
  const duration = channels[channelNumber].duration;
  const targetTime = duration * ratio;
  channels[channelNumber].seekTo(targetTime);
}

/**
 * 要素内でのクリック位置の割合を取得
 * @param {HTMLElement} element - 要素
 * @param {MouseEvent} event - マウスイベント
 * @returns {number} 位置の割合（0-1）
 */
function getRatio(element, event) {
  const rect = element.getBoundingClientRect();
  const position = event.clientX - rect.left;
  return Math.max(0, Math.min(1, position / rect.width));
}

/**
 * シークバーを更新
 */
function updateSeekbar() {
  channels.forEach((channel, index) => {
    const deck = document.querySelector(`.deck.ch${index}`);
    const seekBar = deck.querySelector('.seek-bar');
    const bar = seekBar.querySelector('.bar');
    const indicator = seekBar.querySelector('.indicator');
    const current = seekBar.querySelector('.time .current');
    const duration = seekBar.querySelector('.time .duration');
    
    // 時間表示の更新
    const currentTime = channel.currentTime;
    const durationTime = channel.duration;
    const percentage = (currentTime / durationTime) * 100;
    
    bar.style.width = `${percentage}%`;
    indicator.style.left = `${percentage}%`;
    current.textContent = formatTime(currentTime);
    duration.textContent = formatTime(durationTime);
  });
}

/**
 * 秒を時間表示にフォーマット
 * @param {number} seconds - 秒数
 * @returns {string} フォーマットされた時間
 */
function formatTime(seconds) {
  if (!isFinite(seconds)) return '00:00';
  
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

/**
 * URLかどうかを判定
 * @param {string} text - 判定する文字列
 * @returns {boolean} URLかどうか
 */
function isURL(text) {
  return text.match(/^https?:\/\//i) !== null;
}

/**
 * YouTubeのURLからビデオIDを抽出
 * @param {string} url - YouTube URL
 * @returns {string|null} ビデオID
 */
function parseYouTubeURL(url) {
  let match;
  
  // youtu.be形式
  match = url.match(/youtu\.be\/([^\/\?]+)/i);
  if (match) return match[1];
  
  // v=パラメータ形式
  match = url.match(/youtube\.com\/.*[?&]v=([^&]+)/i);
  if (match) return match[1];
  
  // 埋め込み形式
  match = url.match(/youtube\.com\/embed\/([^\/\?]+)/i);
  if (match) return match[1];
  
  return null;
}

/**
 * YouTubeウィンドウを開く
 */
function openYouTubeWindow() {
  window.open('https://www.youtube.com/', 'YouTube', 'width=800,height=600');
}

/**
 * スイッチング時間を設定
 */
function setSwitchingDuration() {
  const current = Storage.load('config-switching-duration', 0.3);
  const newValue = prompt('映像スイッチング速度（秒）', current);
  
  if (newValue !== null && !isNaN(parseFloat(newValue))) {
    Storage.save('config-switching-duration', parseFloat(newValue));
  }
}

/**
 * 設定の初期化
 */
function initializeConfig() {
  // UIに設定を反映
  document.getElementById('config-exit-confirmation').checked = 
    Storage.load('config-exit-confirmation', true);
  
  document.getElementById('config-auto-projection').checked = 
    Storage.load('config-auto-projection', true);
  
  document.getElementById('config-projection-scale').value = 
    Storage.load('config-projection-scale', 1);
  
  document.getElementById('config-seek-click').checked = 
    Storage.load('config-seek-click', true);
  
  document.getElementById('config-switching-duration').value = 
    Storage.load('config-switching-duration', 0.3);
  
  document.getElementById('config-always-on-top').checked = 
    Storage.load('config-always-on-top', true);
  
  // 設定変更のイベントリスナー
  document.getElementById('config-exit-confirmation').addEventListener('change', (e) => {
    Storage.save('config-exit-confirmation', e.target.checked);
  });
  
  document.getElementById('config-auto-projection').addEventListener('change', (e) => {
    Storage.save('config-auto-projection', e.target.checked);
  });
  
  document.getElementById('config-projection-scale').addEventListener('input', (e) => {
    Storage.save('config-projection-scale', parseFloat(e.target.value));
  });
  
  document.getElementById('config-seek-click').addEventListener('change', (e) => {
    Storage.save('config-seek-click', e.target.checked);
  });
  
  document.getElementById('config-switching-duration').addEventListener('change', (e) => {
    Storage.save('config-switching-duration', parseFloat(e.target.value));
  });
  
  document.getElementById('config-always-on-top').addEventListener('change', (e) => {
    Storage.save('config-always-on-top', e.target.checked);
  });
}

/**
 * 設定画面の表示/非表示
 */
function toggleConfig() {
  document.getElementById('config').classList.toggle('hidden');
}

/**
 * ライブラリの初期化
 */
function initializeLibrary() {
  // この関数は実際にはLibraryクラスで実装される予定
  // ここでは空の実装としておく
}

/**
 * ライブラリの表示/非表示
 */
function toggleLibrary() {
  document.getElementById('library').classList.toggle('hidden');
  document.getElementById('library-status').querySelector('.indicator').classList.toggle('active');
}

/**
 * ライブラリのフォーカス切り替え
 */
function toggleLibraryFocus() {
  // この関数は実際にはLibraryクラスで実装される予定
  // ここでは空の実装としておく
}

/**
 * ライブラリの上方向ナビゲーション
 */
function libraryNavigateUp() {
  // この関数は実際にはLibraryクラスで実装される予定
  // ここでは空の実装としておく
}

/**
 * ライブラリの下方向ナビゲーション
 */
function libraryNavigateDown() {
  // この関数は実際にはLibraryクラスで実装される予定
  // ここでは空の実装としておく
}

/**
 * MIDIの初期化
 */
function initializeMIDI() {
  // MIDIの使用可能性をチェック
  if (navigator.requestMIDIAccess) {
    requestMIDIAccess(true);
  }
}

/**
 * MIDI機器へのアクセスをリクエスト
 * @param {boolean} startup - 起動時のアクセスかどうか
 */
function requestMIDIAccess(startup = false) {
  navigator.requestMIDIAccess({ sysex: false })
    .then(onMIDISuccess, onMIDIFailure);
    
  function onMIDISuccess(midiAccess) {
    // ここでMIDIアクセスを処理
    document.getElementById('midi-device-status').querySelector('.indicator').classList.add('active');
  }
  
  function onMIDIFailure() {
    if (!startup) {
      alert('MIDIデバイスへのアクセスに失敗しました。');
    }
  }
}

/**
 * MIDIエディタの表示/非表示
 */
function toggleMIDIEditor() {
  // MIDIスクリプト編集機能の実装は省略
} 