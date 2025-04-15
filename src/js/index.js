import '../scss/main.scss';
import '../scss/fader.scss';
import VJPlayer from './components/VJPlayer.js';
import { initializeUI, initializeEventListeners } from './controller.js';

// APIの読み込みとアプリケーションの初期化
let apiLoaded = false;
let termsAgreed = false;

/**
 * YouTube API読み込み後のコールバック
 */
window.onYouTubeIframeAPIReady = function() {
  apiLoaded = true;
  initAppIfReady();
};

/**
 * 利用規約同意とAPI読み込みの両方が完了したらアプリを初期化
 */
function initAppIfReady() {
  if (apiLoaded && termsAgreed) {
    initializeApplication();
  }
}

/**
 * アプリケーションの初期化
 */
function initializeApplication() {
  // VJPlayer（チャンネル）のインスタンス作成
  const channels = [
    new VJPlayer(0, { autoplay: true }),
    new VJPlayer(1)
  ];
  
  // UI初期化
  initializeUI(channels);
  
  // イベントリスナー初期化
  initializeEventListeners(channels);
  
  // 自動プロジェクション起動
  if (localStorage.getItem('config-auto-projection') !== 'false') {
    setTimeout(() => {
      openProjectionWindow();
    }, 1000);
  }
}

/**
 * プロジェクションウィンドウを開く
 */
function openProjectionWindow() {
  const width = window.screen.width;
  const height = window.screen.height;
  
  const projectionWindow = window.open(
    'projection.html',
    'YouTube-VJ_Projection',
    `width=${width},height=${height}`
  );
  
  if (projectionWindow) {
    projectionWindow.focus();
    document.getElementById('projection-status').querySelector('.indicator').classList.add('active');
  }
}

// 利用規約同意ボタンのイベントリスナー
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('terms-agree-btn').addEventListener('click', () => {
    document.getElementById('terms').style.display = 'none';
    termsAgreed = true;
    initAppIfReady();
  });
}); 